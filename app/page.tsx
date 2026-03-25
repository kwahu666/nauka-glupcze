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
    <main className="min-h-screen bg-black text-white font-sans overflow-x-hidden">
      
    <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-md border-b border-zinc-900 p-4 md:p-6 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="h-8 md:h-10 w-auto flex-shrink-0">
            <img src="/logo.svg" alt="Logo" className="h-full w-auto object-contain" />
          </div>
          
          {/* Poprawiony pasek nawigacji */}
          <nav className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar justify-start md:justify-end pb-2 md:pb-0 px-1 snap-x">
            <Link href="/?cat=wszystko" className={`snap-start flex-none whitespace-nowrap px-5 py-2.5 rounded-full text-[11px] md:text-xs font-bold uppercase tracking-wider transition ${currentCategory === 'wszystko' ? 'bg-blue-400 text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>Wszystko</Link>
            <Link href="/?cat=ogladanie" className={`snap-start flex-none whitespace-nowrap px-5 py-2.5 rounded-full text-[11px] md:text-xs font-bold uppercase tracking-wider transition ${currentCategory === 'ogladanie' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>Do oglądania</Link>
            <Link href="/?cat=czytanie" className={`snap-start flex-none whitespace-nowrap px-5 py-2.5 rounded-full text-[11px] md:text-xs font-bold uppercase tracking-wider transition ${currentCategory === 'czytanie' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>Do czytania</Link>
          </nav>
        </div>
      </header>

      {/* WIDOK MOBILE */}
      <div key={currentCategory} className="md:hidden flex h-[calc(100vh-140px)] w-full overflow-x-scroll snap-x snap-mandatory gap-4 px-4 no-scrollbar">
        {filteredItems.map((item, index) => (
          <MobileCard key={index} item={item} />
        ))}
      </div>

      {/* WIDOK DESKTOP */}
      <div className="hidden md:grid md:grid-cols-3 gap-8 p-8 max-w-7xl mx-auto">
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
        <span className={`px-6 py-3 rounded-xl font-bold text-xs uppercase text-left ${item.isVideo ? 'bg-red-600 text-white' : 'bg-white text-black'}`}>{item.isVideo ? '▶ Do oglądania' : 'Do czytania'}</span>
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
           <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded text-left ${item.isVideo ? 'bg-red-950 text-red-500' : 'bg-zinc-800 text-zinc-300'}`}>{item.isVideo ? 'Wideo' : 'Czytaj...'}</span>
        </div>
      </div>
    </a>
  );
}
