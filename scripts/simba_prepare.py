"""Prepara le immagini per il video 22simba: rifila le bande nere, ingrandisce (Lanczos) e aumenta la nitidezza.
Estrae anche il logo MIRIA dal titolo dell'Atto II come PNG trasparente."""
from PIL import Image, ImageFilter
import numpy as np, os

S, O = 'tmp/stills/', 'public/simba/img/'
os.makedirs(O, exist_ok=True)
PICK = {
    'freedom_cover': 'MGWw9EnlhpA_maxresdefault', 'freedom_cover2': 'MGWw9EnlhpA_maxres2',
    'smile': '2QHZ4OcHPIs_maxres3', 'crowd_bw': 's9EI_ImVr5E_maxresdefault',
    'verona_a': 'KWGnk1DPGh4_maxres1', 'verona_b': 'KWGnk1DPGh4_maxres3',
    'forum_a': 't3nF9z8btAQ_maxres1', 'forum_b': 't3nF9z8btAQ_maxres3',
    'nonna': '8GhBEeGHS2Y_maxres1', 'atto2': '8GhBEeGHS2Y_maxres3',
    'roccia_a': 'PGtcFvsae40_maxres1', 'roccia_b': 'PGtcFvsae40_maxres2', 'roccia_crowd': 'PGtcFvsae40_maxresdefault',
    'stage22': 'ABuxdkNlOP4_maxresdefault', 'shine_a': 'ABuxdkNlOP4_maxres1', 'shine_b': 'ABuxdkNlOP4_maxres2',
    'rho_a': 'z50BJpSQ7WQ_maxres1', 'rho_b': 'z50BJpSQ7WQ_maxres2',
    'tree_sunset': 'TkBmgXsPZFU_maxresdefault', 'tree_night': 'jRdhqbcLuO4_maxresdefault',
    'blue_art': '0XIcEw3mLYA_maxresdefault', 'session_a': 'HvJ2ejYSO_s_maxres1', 'session_b': 'HvJ2ejYSO_s_maxres3',
    'fans_a': 's9EI_ImVr5E_maxres1', 'fans_b': 's9EI_ImVr5E_maxres3', 'zeri': 'P0ZLHm7C6x0_maxres1',
}
for k, v in PICK.items():
    im = Image.open(S + v + '.jpg').convert('RGB')
    a = np.asarray(im).max(axis=2)
    cols = np.where(a.mean(axis=0) > 18)[0]
    rows = np.where(a.mean(axis=1) > 18)[0]
    im = im.crop((cols[0], rows[0], cols[-1] + 1, rows[-1] + 1))
    r = 2560 / im.width
    im = im.resize((2560, round(im.height * r)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2.2, percent=70, threshold=2))
    im.save(O + k + '.jpg', quality=88)

# logo MIRIA: tratti bianchi del titolo dell'Atto II
src = np.asarray(Image.open(S + '8GhBEeGHS2Y_maxresdefault.jpg').convert('RGB')).astype(int)
x0, y0, x1, y1 = 255, 305, 1045, 525
c = src[y0:y1, x0:x1]
mask = ((c.min(axis=2) > 200) & (c.max(axis=2) - c.min(axis=2) < 30)).astype(np.uint8) * 255
yy, xx = np.mgrid[y0:y1, x0:x1]
mask[(xx > 935) & (xx < 1015) & (yy < 440)] = 0  # esclude la canottiera bianca sullo sfondo
m = Image.fromarray(mask).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
logo = Image.new('RGBA', m.size, (255, 255, 255, 0))
logo.putalpha(m)
logo.resize((m.width * 2, m.height * 2), Image.LANCZOS).save(O + 'logo_miria.png')
