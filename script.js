console.log('Script js  loaded');
const API_KEY = 'a316d1be';//replace this with your own omdb key
const BASE_URL = 'http://www.omdbapi.com/';
/* Using DOM */
const input = document.getElementById('query');
const selectType = document.getElementById('type');
const year = document.getElementById('year');
const searchBtn = document.getElementById('searchBtn');
const statusEl = document.getElementById('status');
const resultEl = document.getElementById('result');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');
/* for pagination */
let currentPage = 1;
let totalPages = 0;
let lastQuery = '';
/* buildUrl : helper function */
function buildUrl(params={}){
    const url = new URL(BASE_URL);
    url.searchParams.set('apikey',API_KEY)// guarantees every request is authorized
    //loop through each parameter
    Object.keys(params).forEach(k=>{
        if(params[k]!==""&&params[k]!=null){
            url.searchParams.set(k,params[k]);
        }
    });
    return url.toString();
}
// debounce function:to avoid to many requests while typing
function debounce (fn,wait=300){
    let t;
    return(...args)=>{
        clearTimeout(t);
        t = setTimeout(()=>fn(...args),wait);
    };
}
/* Show loading */
function setLoading(loading=true){
    if(loading){
        statusEl.innerHTML = `<span class="loading">Searching...</span>`;
    }
    else{
        statusEl.textContent='';
    }
}
/* Error*/
function showMessage(msg,isError=false){
    resultEl.innerHTML=`<div class="${isError?'err':'muted'}">${msg}</div>`;;
    pageInfo.textContent = `Page 0 of 0`;
    prevBtn.disabled = nextBtn.disabled = true;
}
/* render result cards */
function renderResults(list){
    if(!Array.isArray(list) || list.length == 0){
        showMessage('No results found');
        return;
    }
    resultEl.innerHTML='';
    list.forEach(item=>{
        const el = document.createElement('article');
        el.className = 'card-item'
        //poster
        const poster = (item.Poster && item.Poster != 'N/A')? item.Poster:'';
        const img = document.createElement('img');
        img.className = 'poster';
        img.alt = `${item.Title} poster`;

        img.src = (item.Poster && item.Poster !== 'N/A')
        ? item.Poster
        : 'fallback.png';

        img.onerror = () => {
        img.src =
            'data:image/svg+xml;utf8,' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450">' +
            '<rect width="100%" height="100%" fill="%230a0a0a"/>' +
            '<text x="50%" y="50%" fill="%239aa4b2" font-size="18" ' +
            'dominant-baseline="middle" text-anchor="middle">' +
            'No Poster</text></svg>';
        };

        el.appendChild(img);
        const title = document.createElement('div');
        title.className = 'title';
        title.textContext = item.Title;
        el.appendChild(title);
        const subtitle = document.createElement('div');
        subtitle.className = 'subtitle';
        subtitle.textContent = `${item.Year}.${item.Type}`;
        el.appendChild(subtitle);

        //to open imdb page if imdb id present
        if(item.imdbID){
            el.style.cursor = 'pointer';
            el.addEventListener('click',()=>{
                window.open(`https://www.imdb.com/title/${item.imdbID}/`,'_blank');
            });
        }
        resultEl.appendChild(el);
    });
}
/* perform search using OMBD endpoint */
async function searchMovies(query,options={}){
    if(!query || query.trim().length < 1){
        showMessage('Please enter a Movie Title to search');
        return;
    }

    const page = options.page || 1;
    setLoading(true);
    try{
       const params = {s:query.trim(),page:page };
       if (options.type) params.type = options.type;
       if (options.year) params.y = options.year;
       const url = buildUrl(params);
       console.log('FinalUrl:',url)
       const res = await fetch(url);
       if(!res.ok) throw new Error(`Network error:${res.status}`);
       const data = await res.json();
       //if response:'false, movie not found!
       if (data.Response === 'False'){
        showMessage(data.Error || 'No results Found');
        setLoading(false);
        return;
       }
       //result handling and pagination
       //data.search is array of movies and data.totalResults is string number
       const list = data.Search || [];
       const totalResults = parseInt(data.totalResults || (list.length),10)
       totalPages = Math.ceil(totalResults/10);
       renderResults(list);
       //update page indicator
       pageInfo.textContent = `Page ${page} of ${totalPages}`;
       prevBtn.disabled = page<=1;
       nextBtn.disabled = page>=totalPages;
       currentPage = page;
       lastQuery = query;//last search item
       setLoading(false);
    }
    catch(err){
        console.log(err);
        showMessage('Request failed.Check console for details',true);
        setLoading(false);
    }
}
/* Wire Up UI */
const doSearch = debounce(()=>{
    currentPage = 1;
    const q = input.value;
    const t = selectType.value;
    const y = year.value;
    searchMovies(q,{page:1,type: t||undefined, year:y||undefined});
},350)
input.addEventListener('input',doSearch);
selectType.addEventListener('change',doSearch);
year.addEventListener('input',doSearch);
searchBtn.addEventListener('click',(e)=>{
    e.preventDefault();
    doSearch();
});
prevBtn.addEventListener('click',()=>{
    if(currentPage > 1){
        const q = lastQuery;
        const t = selectType.value;
        const y = year.value;
        searchMovies(q,{page: currentPage - 1, type: t||undefined, year: y||undefined});
    }
});
nextBtn.addEventListener('click',()=>{
    if(currentPage < totalPages){
        const q = lastQuery;
        const t = selectType.value;
        const y = year.value;
        searchMovies(q,{page: currentPage + 1, type: t||undefined, year: y||undefined});
    }
});
/* initial user message */
showMessage('Enter a title and press search');