import * as pdfjsLib from 'pdfjs-dist';
import { TeacherSchedule } from '../types';

// Beállítjuk a worker forrást
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface TextItem {
    str: string;
    transform: number[]; // [scaleX, skewY, skewX, scaleY, x, y]
    width: number;
    height: number;
}

export const processPdfFile = async (file: File): Promise<TeacherSchedule[]> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        const schedules: TeacherSchedule[] = [];

        // Napok nevei a fejléc azonosításához
        const dayNames = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek'];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const items = textContent.items as any[] as TextItem[];

            // 1. Tanár nevének keresése (Feltételezzük, hogy az oldal tetején van, a táblázat felett)
            // Keressük a legmagasabb Y koordinátájú, nem üres szöveget, ami nem "Kréta" vagy fejléc
            let teacherName = "";
            let maxY = -1;

            // Először keressük meg a táblázat fejlécét (Napok), hogy tudjuk, mi van felette
            let headerY = -1;
            const dayColumns: { name: string, x: number }[] = [];

            items.forEach(item => {
                const str = item.str.trim();
                if (dayNames.includes(str)) {
                    // Ez egy nap oszlop fejléce
                    if (item.transform[5] > headerY) {
                        // Ha több ilyen van, vegyük azt, amelyik a többi nappal egy sorban van (kb)
                        // Egyszerűsítés: az első találat Y-ja lesz a referencia
                        headerY = item.transform[5];
                    }
                    dayColumns.push({ name: str, x: item.transform[4] });
                }
            });

            // Rendezzük a napokat X koordináta szerint
            dayColumns.sort((a, b) => a.x - b.x);

            // Ha nincs fejléc, ugorjuk a lapot (nem órarend)
            if (dayColumns.length === 0) continue;

            // Tanár neve: A fejléc FELETT (nagyobb Y) lévő szövegek közül a legjelentősebb
            items.forEach(item => {
                const y = item.transform[5];
                const str = item.str.trim();
                // Csak a fejléc felett keresünk
                if (y > headerY + 20) { // +20 buffer
                    // Kizárjuk a rendszer szövegeket
                    if (str && str !== "KRÉTA" && !str.includes("hét") && !str.match(/^\d+$/)) {
                        // Feltételezzük, hogy a név a bal oldalon vagy középen van, és kiemelt
                        // Egyszerű heurisztika: az első értelmes szöveg fentről lefelé
                        if (!teacherName || y > maxY) {
                            teacherName = str;
                            maxY = y;
                        }
                    }
                }
            });

            if (!teacherName) {
                console.log(`Page ${pageNum}: No teacher name found, skipping.`);
                continue;
            }

            // 2. Sorok (Órák) azonosítása
            // Keressük az "1.", "2.", ... szövegeket a bal szélen
            const periodRows: { period: number, y: number }[] = [];
            items.forEach(item => {
                const str = item.str.trim();
                // Regex: szám és pont, pl "1." vagy csak "1"
                const match = str.match(/^(\d+)\.?$/);
                if (match) {
                    const periodNum = parseInt(match[1]);
                    const x = item.transform[4];
                    // Feltételezzük, hogy a sorszámok a bal szélen vannak (pl. x < 100)
                    if (x < 100 && periodNum >= 1 && periodNum <= 8) {
                        periodRows.push({ period: periodNum, y: item.transform[5] });
                    }
                }
            });

            // Rendezzük az órákat
            periodRows.sort((a, b) => a.period - b.period);

            // 3. Lyukasórák keresése
            const freePeriods: { [day: string]: number[] } = {
                'Hétfő': [], 'Kedd': [], 'Szerda': [], 'Csütörtök': [], 'Péntek': []
            };

            // Oszlop szélesség becslése (a következő nap X koordinátájáig)
            // Az utolsó oszlop szélességét becsüljük az előzők átlagából
            let avgColWidth = 100;
            if (dayColumns.length > 1) {
                avgColWidth = dayColumns[1].x - dayColumns[0].x;
            }

            // Végigmegyünk minden napon és minden órán (1-8)
            dayNames.forEach((dayName, dayIndex) => {
                const dayCol = dayColumns.find(d => d.name === dayName);
                if (!dayCol) return; // Ha hiányzik a nap oszlop (pl. rövid hét?), akkor mind lyukas? Nem, inkább skip.

                const colStartX = dayCol.x - 10; // Kis buffer balra
                const colEndX = (dayIndex < dayColumns.length - 1)
                    ? dayColumns[dayIndex + 1].x - 10
                    : dayCol.x + avgColWidth;

                // Ellenőrizzük az 1-8. órákat
                for (let p = 1; p <= 8; p++) {
                    const row = periodRows.find(r => r.period === p);

                    if (!row) {
                        // Ha nem találjuk a sor számát (pl. nincs 8. óra kiírva), akkor az lyukas?
                        // Vagy a táblázat véget ért?
                        // Feltételezzük, hogy ha a sor hiányzik, akkor ott nincs óra -> lyukas.
                        freePeriods[dayName].push(p);
                        continue;
                    }

                    // Sor magasság becslése (következő sorig, vagy fix érték)
                    // PDF-ben Y felfelé nő, tehát a következő sor Y-ja KISEBB.
                    // De a sorok sorrendje: 1. (magas Y), 2. (alacsonyabb Y).
                    let rowTopY = row.y + 10; // A szám közepe + buffer
                    let rowBottomY = row.y - 20; // Becsült sor magasság lefelé

                    // Pontosabb magasság, ha van következő sor
                    const nextRow = periodRows.find(r => r.period === p + 1);
                    if (nextRow) {
                        rowBottomY = nextRow.y + 10; // A következő sor teteje
                    } else {
                        // Ha nincs következő, akkor az előző távolságot használjuk
                        const prevRow = periodRows.find(r => r.period === p - 1);
                        if (prevRow) {
                            const dist = prevRow.y - row.y;
                            rowBottomY = row.y - dist + 10;
                        }
                    }

                    // KERESÉS: Van-e szöveg ebben a cellában?
                    // X: colStartX ... colEndX
                    // Y: rowBottomY ... rowTopY

                    let hasContent = false;
                    for (const item of items) {
                        const ix = item.transform[4];
                        const iy = item.transform[5];
                        const istr = item.str.trim();

                        if (istr && ix >= colStartX && ix <= colEndX && iy >= rowBottomY && iy <= rowTopY) {
                            // Van szöveg a cellában!
                            // Kizárjuk a sorszámot, ha esetleg belelógna (de az X < 100)
                            if (ix > 100) {
                                hasContent = true;
                                break;
                            }
                        }
                    }

                    if (!hasContent) {
                        freePeriods[dayName].push(p);
                    }
                }
            });

            schedules.push({
                name: teacherName,
                freePeriods: freePeriods
            });

            console.log(`Processed ${teacherName}:`, freePeriods);
        }

        return schedules;
    } catch (error: any) {
        console.error("Részletes PDF hiba:", error);
        throw new Error(`PDF feldolgozási hiba: ${error.message || error}`);
    }
};
