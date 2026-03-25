import Parser from 'rss-parser';
import Link from 'next/link';

// ⏱️ Odświeżanie co 15 minut
export const revalidate = 900; 

interface NewsItem {
  title?: string;
  link?: string;
  pubDate?: string;
  sourceName: string;
  category: string;
  isVideo: boolean;
  excerpt: string;
  finalImageUrl?: string | null;
  [key: string]: any; 
}

const MOJA_BAZA_ZRODEL = [
  { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCIUYdIIld_2bsymqWDCdOFQ', kategoria: 'ogladanie', nazwa: 'Astrofaza' },
  { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCxZGztWF3HTYTs3iQlRkWrg', kategoria: 'ogladanie', nazwa: 'AstroLife' },
  { url: 'https://naukaoklimacie.pl/feed', kategoria: 'czytanie', nazwa: 'Nauka o Klimacie' },
  { url: 'https://space24.pl/_rss', kategoria: 'czytanie', nazwa: 'Space24' },
  { url: 'https://www.urania.edu.pl/rss2.xml', kategoria: 'czytanie', nazwa: 'Urania' },
  { url: 'https://kosmonauta.net/feed/', kategoria: 'czytanie', nazwa: 'Kosmonauta.net' },
  { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCXKWrcVNSNJqpxQICG4nB-A', kategoria: 'ogladanie', nazwa: 'Wydział FAIS' },
  { url: 'https://www.kwantowo.pl/feed/', kategoria: 'czytanie', nazwa: 'Kwantowo.pl' },
  { url: 'https://naukawpolsce.pl/kosmos/rss.xml', kategoria: 'czytanie', nazwa: 'Nauka w Polsce: Kosmos' },
  { url: 'https://naukawpolsce.pl/materia/rss.xml', kategoria: 'czytanie', nazwa: 'Nauka w Polsce: Materia' },
  { url: 'https://naukawpolsce.pl/technologia/rss.xml', kategoria: 'czytanie', nazwa: 'Nauka w Polsce: Technologia' }
];

function cleanText(text: any, limit: number = 160): string {
  if (!text || typeof text !== 'string') return "";
  const clean = text.replace(/<[^>]*>?/gm, '').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim();
  if (clean.length <= limit) return clean;
  return clean.slice(0, limit) + "...";
}

function getImageUrlFromRss(item: any): string | null {
  if (item.link && (item.link.includes('youtube.com/watch') || item.link.includes('youtu.be'))) {
    const videoIdMatch = item.link.match(/v=([^&]+)/);
    if (videoIdMatch && videoIdMatch[1]) return `https://i.ytimg.com/vi/${videoIdMatch[1]}/maxresdefault.jpg`;
  }
  if (item.enclosure?.type?.startsWith('image/')) return item.enclosure.url;
  const possibleContents = [item['content:encoded'], item.content, item.description];
  for (const content of possibleContents) {
    if (!content) continue;
    const matchSrcset = content.match(/<img[^>]+srcset="([^"]+)"[^>]*>/);
    if (matchSrcset && matchSrcset[1]) return matchSrcset[1].split(',').pop().trim().split(' ')[0];
    const matchSrc = content.match(/<img[^>]+src="([^">]+)"/);
    if (matchSrc && matchSrc[1]) return matchSrc[1];
  }
  return null;
}

async function fetchOgImageFromWebsite(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const html = await res.text();
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    return ogMatch ? ogMatch[1] : null;
  } catch (e) { return null; }
}

export default async function Home(props: any) {
  // Rozwiązanie problemu Next.js 15
  const searchParams = await (props.searchParams || {});
  const currentCategory = searchParams.cat || 'wszystko';
  
  const parser = new Parser({
    customFields: { item: [['media:group', 'mediaGroup']] }
  });

  let allItems: NewsItem[] = [];

  try {
    const feedPromises = MOJA_BAZA_ZRODEL.map(zrodlo => 
      parser.parseURL(zrodlo.url).then(feed => ({ feed, config: zrodlo })).catch(() => null)
    );
    const results = await Promise.all(feedPromises);
    
    results.forEach(result => {
      if (result?.feed?.items) {
        // Tu zablokowaliśmy błąd TypeScripta
        result.feed.items.forEach((item: any) => {
          const rawDescription = item.mediaGroup?.['media:description']?.[0] || item.contentSnippet || item.content || item.description || "";

          allItems.push({
            ...item,
            sourceName: result.config.nazwa, 
            category: result.config.kategoria,
            isVideo: result.config.kategoria === 'ogladanie',
            excerpt: cleanText(rawDescription)
          });
        });
      }
    });
    
    allItems.sort((a, b) => {
      const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return dateB - dateA;
    });

    const itemsToProcess = allItems.slice(0, 45);
    await Promise.all(itemsToProcess.map(async (item) => {
      let img = getImageUrlFromRss(item);
      if (!img && item.link) img = await fetchOgImageFromWebsite(item.link);
      item.finalImageUrl = img;
    }));
    allItems = itemsToProcess;
  } catch (error) {
    return <div className="h-screen flex items-center justify-center bg-black text-red-500 font-bold p-4 text-center">BŁĄD DANYCH...</div>;
  }

  const filteredItems = allItems.filter(item => currentCategory === 'wszystko' || item.category === currentCategory);

  return (
    <main key={currentCategory} className="min-h-screen bg-black text-white font-sans overflow-x-hidden relative">
      
      {/* UKRYTY CHECKBOX STERUJĄCY MENU */}
      <input type="checkbox" id="menu-toggle" className="peer hidden" />

      {/* GÓRNY PASEK - przezroczysty, logo + hamburger */}
      <header className="absolute top-0 left-0 w-full z-30 bg-gradient-to-b from-black/90 via-black/40 to-transparent p-4 md:p-6 pointer-events-none flex justify-between items-start">
        <Link href="/" className="h-8 md:h-12 w-auto flex-shrink-0 cursor-pointer transition-transform hover:scale-105 pointer-events-auto">
          <img src="/logo.svg" alt="Logo" className="h-full w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
        </Link>

        {/* PRZYCISK MENU */}
        <label htmlFor="menu-toggle" className="cursor-pointer pointer-events-auto p-2.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 transition shadow-lg mt-1 md:mt-0">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </label>
      </header>

      {/* BOCZNY PANEL Z KATEGORIAMI */}
      <nav className="fixed top-0 right-0 h-full w-72 bg-zinc-950/95 backdrop-blur-xl border-l border-white/10 z-50 transform translate-x-full peer-checked:translate-x-0 transition-transform duration-300 ease-out flex flex-col p-6 shadow-2xl">
        <div className="flex justify-end mb-10">
          <label htmlFor="menu-toggle" className="cursor-pointer p-2 bg-white/5 rounded-full hover:bg-white/10 transition">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </label>
        </div>
        
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-2">Filtruj zawartość</p>
          
          <Link href="/?cat=wszystko" className={`flex items-center gap-4 px-4 py-4 rounded-2xl font-bold uppercase tracking-wider transition ${currentCategory === 'wszystko' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-zinc-400 hover:bg-white/5 border border-transparent'}`}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            Wszystko
          </Link>
          
          <Link href="/?cat=ogladanie" className={`flex items-center gap-4 px-4 py-4 rounded-2xl font-bold uppercase tracking-wider transition ${currentCategory === 'ogladanie' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'text-zinc-400 hover:bg-white/5 border border-transparent'}`}>
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>
            Do oglądania
          </Link>
          
          <Link href="/?cat=czytanie" className={`flex items-center gap-4 px-4 py-4 rounded-2xl font-bold uppercase tracking-wider transition ${currentCategory === 'czytanie' ? 'bg-white/10 text-white border border-white/20' : 'text-zinc-400 hover:bg-white/5 border border-transparent'}`}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
            Do czytania
          </Link>
        </div>
      </nav>

      {/* TŁO OVERLAY PO OTWARCIU MENU */}
      <label htmlFor="menu-toggle" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 opacity-0 pointer-events-none peer-checked:opacity-100 peer-checked:pointer-events-auto transition-opacity duration-300 cursor-pointer"></label>

      {/* WIDOK MOBILE - Kafelki przesunięte do góry */}
      <div className="md:hidden flex h-[100dvh] w-full overflow-x-scroll snap-x snap-mandatory gap-4 px-4 no-scrollbar pt-20 pb-8">
        {filteredItems.map((item, index) => (
          <MobileCard key={index} item={item} />
        ))}
      </div>

      {/* WIDOK DESKTOP - Kafelki przesunięte do góry */}
      <div className="hidden md:grid md:grid-cols-3 gap-8 px-8 pt-28 pb-12 max-w-7xl mx-auto">
        {filteredItems.map((item, index) => (
          <DesktopCard key={index} item={item} />
        ))}
      </div>
    </main>
  );
}

function MobileCard({ item }: { item: NewsItem }) {
  let gradientColor = item.category === 'ogladanie' ? 'from-red-900/60' : 'from-blue-900/60';
  return (
    <a href={item.link} target="_blank" className="flex-none w-[88vw] h-full snap-center relative flex flex-col rounded-[2.5rem] overflow-hidden bg-zinc-950 text-left border border-zinc-900 shadow-2xl first:ml-4">
      {item.finalImageUrl ? <img src={item.finalImageUrl} className="absolute inset-0 w-full h-full object-cover mt-[-60px]" alt="" /> : <div className={`absolute inset-0 bg-gradient-to-br ${gradientColor} to-black opacity-40`} />}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />
      <div className="absolute top-10 left-6 z-20"><span className="bg-zinc-800/90 text-gray-200 text-[10px] px-3 py-1 rounded-full uppercase tracking-widest border border-zinc-700 shadow-lg">{item.sourceName}</span></div>
      <div className="mt-auto p-8 pb-16 z-20 relative text-left">
        <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest mb-2">
          {item.pubDate ? new Date(item.pubDate).toLocaleDateString('pl-PL') : ''}
        </p>
        <h3 className="text-2xl font-black mb-3 leading-tight tracking-tight text-left">{item.title}</h3>
        <p className="text-sm text-zinc-300 mb-6 line-clamp-2 font-medium leading-relaxed text-left">{item.excerpt}</p>
        <span className={`px-6 py-3 rounded-xl font-bold text-xs uppercase text-left ${item.isVideo ? 'bg-red-600 text-white' : 'bg-white text-black'}`}>{item.isVideo ? '▶ Oglądaj' : 'Do czytania'}</span>
      </div>
    </a>
  );
}

function DesktopCard({ item }: { item: NewsItem }) {
  let gradientColor = item.category === 'ogladanie' ? 'from-red-950/80' : 'from-blue-950/80';
  return (
    <a href={item.link} target="_blank" className="group relative bg-zinc-900/50 rounded-2xl overflow-hidden border border-zinc-800 hover:border-blue-500/50 transition-all flex flex-col h-[520px] shadow-xl text-left">
      <div className="relative h-52 overflow-hidden bg-black text-left">
        {item.finalImageUrl ? <img src={item.finalImageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" /> : <div className={`absolute inset-0 bg-gradient-to-br ${gradientColor} to-black`} />}
        <div className="absolute top-4 left-4 z-10 text-left"><span className="bg-black/80 backdrop-blur-md text-[9px] px-3 py-1 rounded-md uppercase font-bold tracking-wider border border-white/10 text-left">{item.sourceName}</span></div>
      </div>
      <div className="p-6 flex flex-col flex-grow bg-gradient-to-b from-zinc-900/50 to-black text-left">
        <h3 className="font-bold text-xl leading-snug group-hover:text-blue-400 transition-colors line-clamp-2 mb-3 text-left">{item.title}</h3>
        <p className="text-sm text-zinc-400 leading-relaxed line-clamp-4 mb-4 text-left">{item.excerpt}</p>
        <div className="mt-auto pt-4 border-t border-zinc-800 flex justify-between items-center text-left">
           <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest text-left">{item.pubDate ? new Date(item.pubDate).toLocaleDateString('pl-PL') : ''}</p>
           <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded text-left ${item.isVideo ? 'bg-red-950 text-red-500' : 'bg-zinc-800 text-zinc-300'}`}>{item.isVideo ? 'Oglądaj...' : 'Czytaj...'}</span>
        </div>
      </div>
    </a>
  );
}
