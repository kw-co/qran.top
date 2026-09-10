import re
html = open('article.html').read()
tables = re.findall(r'<table.*?>(.*?)</table>', html, re.DOTALL)
surah_map = {
    "الشورى": 42, "التوبة": 9, "البقرة": 2, "الحديد": 57, "إبراهيم": 14, "النمل": 27, "القمر": 54, "الرعد": 13, "الحجر": 15, "الحج": 22,
    "العنكبوت": 29, "الجاثية": 45, "النحل": 16, "الأنعام": 6, "آل عمران": 3, "لقمان": 31, "الزمر": 39, "النور": 24, "السجدة": 32, "يوسف": 12,
    "القصص": 28, "الحشر": 59, "الزخرف": 43, "المدثر": 74, "غافر": 40, "فصلت": 41, "الشعراء": 26, "الفرقان": 25, "مريم": 19
}

print("export interface ResearchData {")
print("    surahNumber: number;")
print("    bookName: string;")
print("    prophet: string;")
print("    evidenceAyah: string;")
print("    description: string;")
print("}\n")
print("export const researchSurahs: Record<number, ResearchData> = {")

for t in tables:
    rows = re.findall(r'<tr.*?>(.*?)</tr>', t, re.DOTALL)
    for r in rows:
        cells = re.findall(r'<t[dh].*?>(.*?)</t[dh]>', r, re.DOTALL)
        if len(cells) >= 4:
            clean_cells = [re.sub(r'<[^>]+>', '', c).strip() for c in cells]
            surah_str = clean_cells[0].replace('سورة ', '').strip()
            if surah_str in surah_map:
                s_num = surah_map[surah_str]
                book_name = clean_cells[1].replace('"', '\\"')
                prophet = clean_cells[2].replace('"', '\\"')
                desc = clean_cells[4].replace('"', '\\"') if len(clean_cells) > 4 else clean_cells[3].replace('"', '\\"')
                # remove html entities like &#1548; (comma), &#1611; (tanween)
                book_name = re.sub(r'&#\d+;', ' ', book_name)
                prophet = re.sub(r'&#\d+;', ' ', prophet)
                desc = re.sub(r'&#\d+;', ' ', desc)
                print(f'    {s_num}: {{ surahNumber: {s_num}, bookName: "{book_name.strip()}", prophet: "{prophet.strip()}", evidenceAyah: "", description: "{desc.strip()}" }},')

print("};")
