/**
 * job-list — job-offers result list (src01 sort header + n-jrt01 cards).
 * P4 integration (2026-09-02): results, count, sort and load-more read the
 * live jobs API (POST /api/jobborse/entities/v1 — SuccessFactors-backed;
 * contract verified server-side, TotalCount 208 at recon). The API sends no
 * CORS headers, so on the pilot origin the fetch fails and the block falls
 * back to the frozen capture fragment (results.html); at cutover
 * (same-origin under rwe.com) the live path activates unchanged.
 * Facet filters (job-side) remain styled placeholders — documented residual.
 */

const API = 'https://www.rwe.com/api/jobborse/entities/v1';
const LOGO_CONTAINER = '0212b60d-b1c6-47b6-8cd4-f75dcaf7a55b';
const PAGE_SIZE = 9;
const FLAGS = { DE: 'job-search-flag-germany.jpg', US: 'job-search-flag-usa.jpg' };

const SORTS = [
  ['Created_tdt desc', 'Newest'],
  ['Facility_t asc', 'Experience level'],
  ['ProductService_t asc', 'Functional area'],
  ['CustomField1_s asc', 'Company'],
  ['City_s asc', 'City'],
];

async function queryJobs(skip, sort) {
  const resp = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      skip, take: String(PAGE_SIZE), SortType: sort, LogoContainerId: LOGO_CONTAINER,
    }),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

function jobCard(job) {
  const lang = job.Locale === 'de' ? 'de_DE' : 'en_GB';
  const detailUrl = `/en/rwe-careers-portal/job-offers/details/?id=${job.Id}&utm_campaign=CMS_Jobsearch&utm_medium=website&utm_source=careersite&jobPipeline=CMS_Jobsearch`;
  const applyUrl = `https://career5.successfactors.eu/career?company=rweProd&career_ns=job_application&lang=${lang}&career_job_req_id=${job.AdCode}&utm_campaign=CMS_Jobsearch&utm_medium=website&utm_source=careersite&jobPipeline=CMS_Jobsearch`;
  const multi = (job.MultiCountry || []).length > 1;
  const flagFile = !multi && FLAGS[job.CountryIso2];
  const city = multi ? 'Various locations' : (job.City || (job.MultiCity || [])[0] || '');

  const li = document.createElement('li');
  li.className = 'col-xs-12';
  li.innerHTML = `<article data-tpl="n-jrt01"><header class="jrt__header">
    <div class="facility color-background-2"></div>
    <a class="link link--internal"><h3 class="mt-10"></h3></a>
    <div class="mt-20">
      <h4 class="subheadline"><div class="imageLogo"><div class="ImageFlagWrapper"></div></div><div class="textCity"><span></span></div></h4>
      <h4 class="subheadline"><div class="jrt__additional-info__workingTime"></div></h4>
      <div class="n-jrt__actions mt-20">
        <div data-tpl="cta01"><a class="btn color-affordance--gradient-green affordance" target="_blank" rel="noreferrer" title="Apply now">Apply now</a></div>
        <div class="n-jrt__actions-right">
          <button class="btn btn--favourite mr-10" title="Add to favourites"><i class="rwe-icon icon-heart color-icon-1"></i></button>
          <div data-tpl="cta01"><a class="btn color-cta--gradient-green">More</a></div>
        </div>
      </div>
    </div>
  </header></article>`;
  li.querySelector('.facility').textContent = job.FacilityText && job.Locale === 'de' ? job.FacilityText : (job.Facility || '');
  const titleA = li.querySelector('a.link--internal');
  titleA.href = detailUrl;
  li.querySelector('h3').textContent = job.Title || '';
  const flagWrap = li.querySelector('.ImageFlagWrapper');
  if (flagFile) {
    const img = document.createElement('img');
    img.alt = 'flag';
    img.className = 'ImageFlag';
    img.src = `/blocks/job-list/${flagFile}`;
    flagWrap.append(img);
  } else {
    const globe = document.createElement('span');
    globe.className = 'ImageFlag ImageFlagInternational';
    flagWrap.append(globe);
  }
  li.querySelector('.textCity span').textContent = city;
  li.querySelector('.jrt__additional-info__workingTime').textContent = job.Shift || '';
  li.querySelector('.affordance').href = applyUrl;
  li.querySelector('.color-cta--gradient-green').href = detailUrl;
  return li;
}

function updatePageCount(total) {
  const h2 = document.querySelector('main .section.jobs-count h2');
  if (h2) h2.textContent = `${total} Jobs of total ${total} Jobs`;
}

async function buildLive(block, first) {
  const state = { skip: 0, sort: 'Created_tdt desc', total: first.TotalCount };

  block.innerHTML = `<div class="jrc">
    <header class="row src-header">
      <div class="col-half">
        <form class="sort-form"><div class="form-group">
          <label for="SortType">Sort</label>
          <div class="select-box" tabindex="0"><p>Newest</p></div>
        </div></form>
      </div>
      <div class="col-half">
        <a class="fav-link" href="https://www.rwe.com/en/rwe-careers-portal/job-offers/my-favourites/">Show my favorites<i class="rwe-icon icon-heart"></i></a>
      </div>
    </header>
    <div class="job-results"><ol></ol>
      <div class="load-more"><button class="btn btn--solid">Load more</button></div>
    </div>
  </div>`;

  const ol = block.querySelector('ol');
  const loadMoreBtn = block.querySelector('.load-more button');
  const append = (results) => results.forEach((j) => ol.append(jobCard(j)));
  append(first.Results || []);
  updatePageCount(state.total);

  const refresh = async (reset) => {
    const data = await queryJobs(state.skip, state.sort);
    state.total = data.TotalCount;
    if (reset) ol.replaceChildren();
    append(data.Results || []);
    updatePageCount(state.total);
    loadMoreBtn.parentElement.style.display = (state.skip + PAGE_SIZE >= state.total) ? 'none' : '';
  };

  loadMoreBtn.addEventListener('click', async () => {
    state.skip += PAGE_SIZE;
    await refresh(false);
  });

  // sort select (live sde01 options), real control over the styled shell
  const selBox = block.querySelector('.select-box');
  const real = document.createElement('select');
  real.className = 'sort-real-select';
  SORTS.forEach(([v, t]) => real.append(new Option(t, v)));
  real.addEventListener('change', async () => {
    state.sort = real.value;
    state.skip = 0;
    selBox.querySelector('p').textContent = real.selectedOptions[0].textContent;
    await refresh(true);
  });
  selBox.append(real);
}

export default async function decorate(block) {
  block.textContent = '';
  try {
    const first = await queryJobs(0, 'Created_tdt desc');
    await buildLive(block, first);
    return;
  } catch (e) {
    // pilot origin (no CORS) or API down → frozen capture fragment
  }
  try {
    const resp = await fetch('/blocks/job-list/results.html');
    if (resp.ok) block.innerHTML = await resp.text();
  } catch (e) {
    // placeholder stays empty if the asset is unavailable
  }
}
