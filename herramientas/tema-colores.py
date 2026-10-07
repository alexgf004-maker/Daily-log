# Genera los colores del tema Halloween a partir de css/styles.css.
# Busca cada regla que usa los azules de la app y escribe su versión en tonos del tema
# entre las marcas AUTO-COLORES de css/temas.css. Correr después de cambiar styles.css:
#   python3 herramientas/tema-colores.py
# Se usa :where(.tema-halloween) para no subir la especificidad: así las reglas más
# específicas de la app (p. ej. .pd-av.v morado) y las hechas a mano del tema siguen ganando.
import re,sys,os
RAIZ=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
css=open(os.path.join(RAIZ,'css/styles.css')).read()
css=re.sub(r'/\*.*?\*/','',css,flags=re.S)
# parse into (prelude, body) with nesting
def parse(s,i=0):
    out=[]; buf=''
    while i<len(s):
        c=s[i]
        if c=='{':
            pre=buf.strip(); buf=''
            if pre.startswith('@media') or pre.startswith('@supports'):
                kids,i=parse(s,i+1); out.append((pre,kids))
            else:
                j=i+1; depth=1
                while depth:
                    if s[j]=='{': depth+=1
                    elif s[j]=='}': depth-=1
                    j+=1
                out.append((pre,s[i+1:j-1])); i=j; continue
        elif c=='}':
            return out,i+1
        else: buf+=c
        i+=1
    return out,i
tree,_=parse(css)
AZ=re.compile(r'#(2563eb|1d4ed8|3b82f6|60a5fa|93c5fd|bfdbfe|dbeafe|eff6ff|1e3a5f|1e40af|1e3a8a|081428|12284a)\b|rgba\(\s*37\s*,\s*99\s*,\s*235',re.I)
PLANO={'2563eb':'#b91c1c','1d4ed8':'#991b1b','3b82f6':'#dc2626','60a5fa':'#f87171','93c5fd':'#fca5a5','bfdbfe':'#fecaca','dbeafe':'#fee2e2','eff6ff':'#fef2f2','1e3a5f':'#450a0a','1e40af':'#7f1d1d','1e3a8a':'#7f1d1d','081428':'#0b0306','12284a':'#1a0509'}
GRAD={'1e3a5f':'#050307','2563eb':'#3b0a10','1d4ed8':'#2a070b','3b82f6':'#5c0d14','1e40af':'#1a0509','1e3a8a':'#1a0509','60a5fa':'#7f1d1d','081428':'#050307','12284a':'#1a0509'}
# colores que son dato (calendario / leyendas): oscuro, no rojo, para no confundir con "tarde"
DATO=re.compile(r'rg-cd\.ok|rg-cal-ley i\.ok|dot\.b\b')
def mapear(decl,sel):
    if DATO.search(sel): return AZ.sub(lambda m:'#3f0d12' if m.group(1) else 'rgba(63,13,18',decl)
    g='gradient' in decl
    def f(m):
        if not m.group(1): return 'rgba(185,28,28'
        k=m.group(1).lower()
        return (GRAD.get(k) or PLANO[k]) if g else PLANO[k]
    return AZ.sub(f,decl)
def split_decls(body):
    # split by ; not inside parentheses or quotes
    out=[];buf='';d=0;q=None
    for c in body:
        if q:
            buf+=c
            if c==q: q=None
            continue
        if c in '"\'': q=c
        elif c=='(': d+=1
        elif c==')': d-=1
        if c==';' and d==0: out.append(buf); buf=''
        else: buf+=c
    if buf.strip(): out.append(buf)
    return [x.strip() for x in out if x.strip()]
def pref(sel):
    parts=[]
    for s in re.split(r',(?![^(]*\))',sel):
        s=s.strip()
        if s.startswith(':root') or s.startswith('html'): continue
        if s.startswith('body'): parts.append(':where(.tema-halloween) '+s)
        else: parts.append(':where(.tema-halloween) '+s)
    return ','.join(parts)
def emit(nodes):
    res=[]
    for pre,body in nodes:
        if isinstance(body,list):
            inner=emit(body)
            if inner: res.append(pre+'{'+''.join(inner)+'}')
            continue
        if pre.startswith('@') or not AZ.search(body): continue
        if 'url(' in body and AZ.search(re.sub(r'url\([^)]*\)','',body)) is None: continue
        ds=[mapear(d,pre) for d in split_decls(body) if AZ.search(re.sub(r'url\([^)]*\)','',d)) and not d.lstrip().startswith('--')]
        if not ds: continue
        p=pref(pre)
        if not p: continue
        res.append(p+'{'+';'.join(ds)+'}')
    return res
reglas=emit(tree)
ruta=os.path.join(RAIZ,'css/temas.css'); t=open(ruta).read()
A,B='/* AUTO-COLORES:INICIO (no editar a mano: herramientas/tema-colores.py) */','/* AUTO-COLORES:FIN */'
bloque=A+'\n'+'\n'.join(reglas)+'\n'+B
t=t[:t.index(A)]+bloque+t[t.index(B)+len(B):] if A in t else t.rstrip('\n')+'\n\n'+bloque+'\n'
open(ruta,'w').write(t)
print(f'{len(reglas)} reglas escritas en css/temas.css')
