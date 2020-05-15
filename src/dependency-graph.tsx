import React, { useMemo, useState } from 'react';
import Graph from 'react-graph-vis';
import { useParams, useHistory } from 'react-router-dom';
import { useDebounce } from 'use-debounce';

import useDependencyTree, { usePackageInfo, allRelationTypes, RelationType } from './use-dependency-tree';

export default () => {
    const { pkgs, relations: _relations } = useParams();
    const inputPackages = (pkgs as string).split(',');
    const inputRelations = (_relations as string).split(',').filter(item => allRelationTypes.includes(item as any)) as RelationType[];
    const { ready, relatedPackages, relations } = useDependencyTree(inputPackages, inputRelations);
    const [selectedPkg, setSelectedPkg] = useState<null | string>(null);

    const { nodes, edges } = useMemo(() => {
        const nodes: any = [];
        const edges: any = [];
        const result = { nodes, edges };

        if (!ready)
            return result;

        relatedPackages.forEach(pkg => nodes.push({
            id: pkg,
            label: pkg,
            color: {
                background: inputPackages.includes(pkg) ? '#A3AF58' : '#F1BB78',
            },
        }));

        for (const [from, to] of relations.depends)
            edges.push({ from, to, smooth: true, color: 'red' });

        for (const [from, to] of relations.imports)
            edges.push({ from, to, smooth: true });

        for (const [from, to] of relations.linkingTo)
            edges.push({ from, to, smooth: true, dashes: true });

        return result;
    }, [relatedPackages]);

    const graph = { nodes, edges };

    const options = {
        edges: {
            color: "#000000"
        },
        height: "100%",
    };

    const events = {
        select: function (event) {
            const { nodes, edges } = event;

            if (nodes.length === 1)
                setSelectedPkg(nodes[0]);
            else
                setSelectedPkg(null);
        },
    };

    return (
        <>
            {!ready && (
                <h2>Loading CRAN index...</h2>
            )}
            {ready && (<>
                <Graph
                    graph={graph}
                    options={options}
                    events={events}
                />
                <Controls selectedPkg={selectedPkg}/>
            </>)}
        </>
    );
};

const Controls = (props: { selectedPkg: string | null }) => {
    return (
        <div className='controls'>
            <strong>Relations:</strong><br/>
            <RelationCheckbox relation="depends"/> <span style={{color: 'red'}}>Depends</span> <br/>
            <RelationCheckbox relation="imports"/> Imports <br/>
            <RelationCheckbox relation="linkingTo"/> Linking To <br/>
            <hr/>
            <strong>Packages:</strong><br/>
            <PackageList/>
            <hr/>
            {props.selectedPkg !== null && (<>
                <strong>Selected Package:</strong> {props.selectedPkg}<br/>
                <a href={`https://cran.r-project.org/web/packages/${props.selectedPkg}/index.html`} target="__blank">
                    CRAN Page
                </a>
                <hr/>
            </>)}
            <a href="https://github.com/tannerntannern/cran-visualizer" target="__blank">Website source</a>
        </div>
    );
};

const RelationCheckbox = (props: { relation: string }) => {
    const { useRelation, relations } = useUrlController();

    const includesRelation = relations.includes(props.relation);

    return (
        <input
            type="checkbox"
            checked={includesRelation}
            onChange={e => useRelation(props.relation, e.target.checked)}/>
    );
};

const PackageList = () => {
    const { usePackage, pkgs } = useUrlController();
    const { packageInfo } = usePackageInfo();

    const [_search, setSearch] = useState('');
    const [search] = useDebounce(_search, 250);

    const searchLimit = 8;
    const { searchMatches, searchLimitReached } = useMemo(() => {
        let searchLimitReached = false;
        const searchMatches: string[] = [];
        if (!packageInfo)
            return { searchMatches, searchLimitReached };

        let found = 0;
        for (let pkg of Object.keys(packageInfo)){
            if (found >= searchLimit) {
                searchLimitReached = true;
                break;
            }

            if (pkg.startsWith(search)) {
                searchMatches.push(pkg);
                found ++;
            }
        }

        return { searchMatches, searchLimitReached };
    }, [search, !!packageInfo]);

    const removePackage = pkg => usePackage(pkg, false);
    const canAddPackage = useMemo(() => (!!packageInfo && search in packageInfo), [search, !!packageInfo]);
    const addPackage = pkg => {
        if (canAddPackage) {
            usePackage(pkg, true);
            setSearch('');
        }
    };

    return (<>
        {pkgs.map(pkg => (
            <div className="package" key={pkg}>
                <span>{pkg}</span>
                <button className="remove" onClick={() => removePackage(pkg)}>x</button>
            </div>
        ))}
        <datalist id="suggestions">
            {searchMatches.map(match => (
                <option value={match} key={match}/>
            ))}
            {searchLimitReached && (
                <option value="..."/>
            )}
        </datalist>
        <input
            list="suggestions"
            placeholder="New package"
            value={_search}
            onChange={e => setSearch(e.target.value)}
            onKeyPress={e => { if (e.key === 'Enter') addPackage(search); }}/>
        <button onClick={() => addPackage(search)} disabled={!canAddPackage}>Add</button>
    </>);
};

const useUrlController = () => {
    const history = useHistory();
    const { pkgs: pkgsString, relations: relationsString } = useParams();
    const pkgs = pkgsString.split(',');
    const relations = relationsString.split(',');

    const updateUrl = (relationsString: string, pkgsString: string) =>
        history.push(`/packages/${relationsString}/${pkgsString}`);

    const useRelation = (relation: string, yesOrNo: boolean) => {
        let newRelationsString = '';
        if (yesOrNo && !relations.includes(relation))
            newRelationsString = [...relations, relation].join(',');
        else if (!yesOrNo && relations.includes(relation))
            newRelationsString = relations.filter(r => r !== relation).join(',');

        updateUrl(newRelationsString, pkgsString);
    };

    const usePackage = (pkg: string, yesOrNo: boolean) => {
        let newPkgsString = '';
        if (yesOrNo && !pkgs.includes(pkg))
            newPkgsString = [...pkgs, pkg].join(',');
        else if (!yesOrNo && pkgs.includes(pkg))
            newPkgsString = pkgs.filter(p => p !== pkg).join(',');

        updateUrl(relationsString, newPkgsString);
    };

    return { useRelation, usePackage, relations, pkgs };
};
