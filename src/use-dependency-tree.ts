import { useMemo } from 'react';
import axios from 'axios';
import useSWR from 'swr';

export const allRelationTypes = ['depends', 'imports', 'linkingTo', 'suggests'] as const;

export type RelationType = (typeof allRelationTypes)[number];

type PackageInfo = {
    name: string,
    version: string,
    depends: string[],
    imports: string[],
    linkingTo: string[],
    suggests: string[],
};

type Link = [string, string];

export default (packageNames: string[], relationTypes: RelationType[]) => {
    const { data: packageInfo, isValidating } = useSWR('package-info', getPackageInfo, { revalidateOnFocus: false });
    const ready = !!packageInfo && !isValidating;
    const packageNamesSignature = packageNames.join(',');
    const relationTypesSignature = relationTypes.join(',');

    const packagesAndRelations = useMemo(() => {
        const packages: string[] = [];
        const relations = {
            depends: [] as Link[],
            imports: [] as Link[],
            linkingTo: [] as Link[],
            suggests: [] as Link[],
        };

        const result = { packages, relations };
        
        if (!ready || !packageInfo) // !packageInfo is not logically necessary but makes type checker happy
            return result;

        const visited = new Set<string>();
        let frontier = new Set<string>();
        packageNames.forEach(name => frontier.add(name));

        while (frontier.size > 0) {
            const nextFrontier = new Set<string>();

            for (let pkg of frontier) {
                const info = packageInfo[pkg];

                if (!!info) {  // builtin packages don't have CRAN listings
                    for (let relationName of relationTypes) {
                        const relatedPackages = info[relationName];
                        const relation = relations[relationName];
                        for (let dep of relatedPackages) {
                            relation.push([pkg, dep]);
                            if (!visited.has(dep) && !frontier.has(dep)) {
                                nextFrontier.add(dep);
                            }
                        }
                    }
                }

                visited.add(pkg);
            }

            frontier = nextFrontier;
        }

        packages.push(...visited);

        return result;
    }, [ready, packageNamesSignature, relationTypesSignature]);

    const { packages: relatedPackages, relations } = packagesAndRelations;

    return { ready, packageInfo, relatedPackages, relations };
};

const getPackageInfo = async () => {
    const packageInfo: Record<string, PackageInfo> = {};
    const data = await axios.get(
        'https://cors-anywhere.herokuapp.com/https://cran.r-project.org/src/contrib/PACKAGES',
        { headers: { 'Origin': 'cran.r-project.org' } },
    );

    const packageStrings = (data.data as string).split('Package: ');
    packageStrings.shift();

    for (let packageString of packageStrings) {
        const name = extractName(packageString);
        const version = extractVersion(packageString);
        const depends = extractPackageList(packageString, 'Depends');
        const imports = extractPackageList(packageString, 'Imports');
        const linkingTo = extractPackageList(packageString, 'LinkingTo');
        const suggests = extractPackageList(packageString, 'Suggests');

        packageInfo[name] = { name, version, depends, imports, linkingTo, suggests };
    }

    return packageInfo;
};

const extractName = (packageString: string) =>
    packageString.split(/\s/, 1)[0].trim();

const extractVersion = (packageString: string) =>
    packageString.split('Version: ')[1].split(/\s/)[0].trim();

const extractPackageList = (packageString: string, label: string): string[] => {
    const cleanString = packageString
        .replace(/\s+/g, ' ')
        .replace(/\([^()]+\)/g, '');

    const packagesMatch = new RegExp(`${label}:\\s+([^:]+)\\s+\\w+:`).exec(cleanString);
    if (packagesMatch === null)
        return [];
    
    const packages = packagesMatch[1]
        .replace(/\s+/g, '')
        .split(',')
        .filter(pkg => pkg !== 'R');  // we never care about depending on R

    return packages;
};