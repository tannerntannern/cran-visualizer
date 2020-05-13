import _axios from 'axios';
import { load } from 'cheerio';

const axios = _axios.create({
    baseURL: 'https://cors-anywhere.herokuapp.com/https://cran.r-project.org/web/packages',
    headers: {
        'Origin': 'cran.r-project.org',
    }
});

type PackageInfo = {
    name: string,
    imports: string[],
    suggests: string[],
};

const packageInfoCache: { [name: string]: PackageInfo | undefined } = {};

const getPackageInfo = async (name: string) => {
    // first check cache
    const cachedPackageInfo = packageInfoCache[name];
    if (!!cachedPackageInfo)
        return cachedPackageInfo;

    // otherwise scrape the cran page for package info
    const html = await axios.get(`${name}/index.html`);
    const $ = load(html.data);
    const tableRows = $('td').toArray();
    const imports = scrapeLinkedPackages(tableRows, 'Imports:');
    const suggests = scrapeLinkedPackages(tableRows, 'Suggests:');

    // update the cache
    const packageInfo: PackageInfo = { name, imports, suggests };
    packageInfoCache[name] = packageInfo;
    
    return packageInfo;
};

const scrapeLinkedPackages = (tableRows: CheerioElement[], label: string) => {
    const labelElement = tableRows.find(element => {
        if (element.children.length !== 1) return false;
        if (element.children[0].type !== 'text') return false;
        if (element.children[0].data !== label) return false;
        return true;
    });

    if (!labelElement) return [];

    const linkedPackages = labelElement
        .nextSibling
        .nextSibling
        .children
        .filter(node => node.type === 'tag' && node.name === 'a')
        .map(node => node.children[0].data) as string[];
    
    return linkedPackages;
};

export {
    getPackageInfo,
};