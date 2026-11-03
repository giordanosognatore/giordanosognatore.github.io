import {books} from './books.mjs';
import {articleSection,escapeHtml} from './taccuino.mjs';

export function bookJournal(articles,bookId){
 const related=articles.filter(article=>article.category==='taccuino'&&article.relatedBooks?.includes(bookId));
 return articleSection(related,{title:'Dal taccuino: dentro e intorno al romanzo'});
}

// Separate from .entry-body: approved Markdown is never rewritten.
export function articleBooks(article,prefix='../'){
 if(article.category!=='taccuino'||!article.relatedBooks?.length)return '';
 const related=article.relatedBooks.map(id=>books.find(book=>book.id===id));
 return `<aside class="entry-books" aria-labelledby="entry-books-title"><p class="eyebrow">DAL TACCUINO AI ROMANZI</p><h2 id="entry-books-title">${related.length===1?'Il romanzo collegato a questo appunto':'I romanzi collegati a questo appunto'}</h2><ul class="entry-book-list">${related.map(book=>`<li><h3>${escapeHtml(book.title)}</h3><div class="entry-book-links"><a class="text-link" href="${prefix}${book.route}">Scopri la storia</a>${book.sampleAnchor?`<a class="text-link" href="${prefix}${book.route}#${book.sampleAnchor}">Leggi l’estratto gratuito</a>`:''}</div></li>`).join('')}</ul></aside>`;
}
