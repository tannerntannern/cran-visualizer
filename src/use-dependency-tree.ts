import { useState, useEffect } from 'react';
import { Set } from 'immutable';

import { getPackageInfo } from './cran-client';

export default (...packageNames: string[]) => {
    const [packages, setPackages] = useState(Set<string>());
    const [searchFrontier, setSearchFrontier] = useState(Set<string>());
    const [importsLinks, setImportsLinks] = useState(Set<[string, string]>());
    const [suggestsLinks, setSuggestsLinks] = useState(Set<[string, string]>());

    const update = (packages: Set<string>, searchFrontier: Set<string>, importsLinks: Set<[string, string]>, suggestsLinks: Set<[string, string]>) => {
        setPackages(packages);
        setSearchFrontier(searchFrontier);
        setImportsLinks(importsLinks);
        setSuggestsLinks(suggestsLinks);
    };

    // TODO: gross
    useEffect(() => {
        (async () => {
            let _packages = Set<string>(),
                _searchFrontier = Set<string>(),
                _importsLinks = Set<[string, string]>(),
                _suggestsLinks = Set<[string, string]>();

            update(_packages, _searchFrontier, _importsLinks, _suggestsLinks);

            for (let packageName of packageNames)
                _searchFrontier = _searchFrontier.add(packageName);

            while (_searchFrontier.size !== 0) {
                let _nextSearchFrontier = Set<string>();

                _searchFrontier.forEach(pkg => {
                    _packages = _packages.add(pkg);
                });

                const frontierInfos = await Promise.all([..._searchFrontier].map(pkg => getPackageInfo(pkg)));
                frontierInfos.forEach(info => {
                    info.imports.forEach(dep => {
                        _nextSearchFrontier = _nextSearchFrontier.add(dep);
                        _importsLinks = _importsLinks.add([info.name, dep]);
                    });
                    
                    // TODO: suggests
                });
                
                _searchFrontier = _nextSearchFrontier;
                update(_packages, _searchFrontier, _importsLinks, _suggestsLinks);
            }
        })();
    }, [packageNames.join(',')]);

    return { packages, importsLinks, suggestsLinks, searchFrontier };
};
