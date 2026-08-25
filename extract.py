import re
html = open('article.html').read()
tables = re.findall(r'<table.*?>(.*?)</table>', html, re.DOTALL)
for t in tables:
    rows = re.findall(r'<tr.*?>(.*?)</tr>', t, re.DOTALL)
    for r in rows:
        cells = re.findall(r'<t[dh].*?>(.*?)</t[dh]>', r, re.DOTALL)
        print(' | '.join([re.sub(r'<[^>]+>', '', c).strip() for c in cells]))
