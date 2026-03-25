import Parser from 'rss-parser';
import Link from 'next/link';

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
  return clean.length <= limit ? clean : clean.slice(0, limit) + "...";
}

export default async function Home(props: any) {
  const searchParams = await (props.searchParams || {});
  const currentCategory = searchParams.cat || 'wszystko';
  
  const parser = new Parser({
    customFields: { item: [['media:group', 'mediaGroup']] }
  });

  let allItems: NewsItem[] = [];

  try {
    const results = await Promise.all(
      MOJA_BAZA_ZRODEL.map(zrodlo => 
        parser.parseURL(zrodlo.url).then(feed => ({ feed, config: zrodlo })).catch(() => null)
      )
    );
    
    results.forEach((result: any) => {
      if (result?.feed?.items) {
        result.feed.items.forEach((item: any) => {
          // Tutaj TS wywalał błąd - wymuszamy typ 'any' na 'item'
          const rawDescription = item.mediaGroup?.['media:description']?.[0] || 
                                 item.contentSnippet || 
                                 item.content || 
                                 item.description || "";

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
    
    allItems.sort((a, b) => new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime());
    allItems = allItems.slice(0, 45);
  } catch (e) {
    console.error(e);
  }

  const filteredItems = allItems.filter(item => currentCategory === 'wszystko' || item.category === currentCategory);

  return (
    <main style={{ backgroundColor: 'black', color: 'white', minHeight: '100vh', padding: '20px' }}>
      <header style={{ marginBottom: '40px', textAlign: 'center' }}>
        <img src="/logo.svg" alt="Logo" style={{ height: '50px', marginBottom: '20px' }} />
        <nav style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <Link href="/?cat=wszystko" style={{ color: currentCategory === 'wszystko' ? 'cyan' : 'white' }}>WSZYSTKO</Link>
          <Link href="/?cat=ogladanie" style={{ color: currentCategory === 'ogladanie' ? 'red' : 'white' }}>WIDEO</Link>
          <Link href="/?cat=czytanie" style={{ color: currentCategory === 'czytanie' ? 'white' : 'gray' }}>TEKST</Link>
        </nav>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {filteredItems.map((item, i) => (
          <a key={i} href={item.link} target="_blank" style={{ border: '1px solid #333', padding: '20px', borderRadius: '15px', textDecoration: 'none', color: 'white', backgroundColor: '#111' }}>
            <small style={{ color: '#666' }}>{item.sourceName}</small>
            <h3 style={{ margin: '10px 0' }}>{item.title}</h3>
            <p style={{ fontSize: '0.9rem', color: '#ccc' }}>{item.excerpt}</p>
          </a>
        ))}
      </div>
    </main>
  );
}
