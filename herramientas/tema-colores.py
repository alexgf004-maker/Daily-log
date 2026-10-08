# Genera los colores del tema Halloween a partir de css/styles.css.
# Busca cada regla que usa los azules de la app (y los colores de estado: verde, rojo, ámbar y
# morado) y escribe su versión en tonos del tema: azul → rojo sangre/negro, verde → verde veneno,
# rojo → sangre, ámbar → calabaza, morado → morado bruja. En degradados, el primer tono sale de la
# oscuridad para que los bloques de color no se vean planos sobre la noche.
# Escribe
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
# Colores de estado: mismo significado (verde bien, rojo mal, ámbar atención, morado ausencia),
# en la paleta de Halloween
EST_PLANO={
 '10b981':'#3a9d23','059669':'#2f7f1b','047857':'#26661a','065f46':'#1d4f15','34d399':'#6cc24a','6ee7b7':'#9ad77c',
 'a7f3d0':'#c9ecb3','d1fae5':'#ddf5cc','ecfdf5':'#f1fbea',
 'ef4444':'#c81e1e','dc2626':'#a31515','f87171':'#e05252',
 'f59e0b':'#e8650c','d97706':'#c2510a','b45309':'#9a3d08','92400e':'#7a2e06','a16207':'#8a3a07','fbbf24':'#f28c28',
 'fcd34d':'#f7ae5e','fde68a':'#fbd0a3','fef3c7':'#fde4cc','fffbeb':'#fff5ea',
 '8b5cf6':'#8040c0','7c3aed':'#6d2fb0','6d28d9':'#5a2396','a78bfa':'#a874d9','ddd6fe':'#e6d3f7','ede9fe':'#efe3fa','f5f3ff':'#f7f0fd'}
EST_GRAD={'059669':'#10240a','047857':'#10240a','10b981':'#3a9d23','dc2626':'#3b0609','b91c1c':'#3b0609','991b1b':'#2a0406','ef4444':'#b31b1b',
 'd97706':'#3b1503','b45309':'#2b0e02','f59e0b':'#d4590a','6d28d9':'#1f0a33','7c3aed':'#2a0d45','8b5cf6':'#6b2fa8'}
ES=re.compile(r'#('+'|'.join(sorted(set(EST_PLANO)|set(EST_GRAD),key=len,reverse=True))+r')\b',re.I)
def mapear_estado(decl):
    g='gradient' in decl
    return ES.sub(lambda m:(EST_GRAD.get(m.group(1).lower()) if g else None) or EST_PLANO.get(m.group(1).lower()) or m.group(0),decl)
def toca(t): return AZ.search(t) or ES.search(t)
def mapear(decl,sel):
    decl=mapear_estado(decl)
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
        if pre.startswith('@') or not toca(body): continue
        if 'url(' in body and toca(re.sub(r'url\([^)]*\)','',body)) is None: continue
        ds=[mapear(d,pre) for d in split_decls(body) if toca(re.sub(r'url\([^)]*\)','',d)) and not d.lstrip().startswith('--')]
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
