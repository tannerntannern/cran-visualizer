import React, { useMemo } from 'react';
import Graph from 'react-graph-vis';
import { useParams, useHistory } from 'react-router-dom';

import useDependencyTree, { allRelationTypes, RelationType } from './use-dependency-tree';

export default () => {
    const { pkgs, relations: _relations } = useParams();
    const inputPackages = (pkgs as string).split(',');
    const inputRelations = (_relations as string).split(',').filter(item => allRelationTypes.includes(item as any)) as RelationType[];
    const { ready, relatedPackages, relations } = useDependencyTree(inputPackages, inputRelations);

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
            var { nodes, edges } = event;
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
                <Controls/>
            </>)}
        </>
    );
};

const Controls = () => {
    const history = useHistory();
    const { pkgs: pkgsString, relations: relationsString } = useParams();
    const pkgs = pkgsString.split(',');
    const relations = relationsString.split(',');

    const depends = relations.includes('depends');
    const imports = relations.includes('imports');
    const linkingTo = relations.includes('linkingTo');

    const useRelation = (relation: string, yesOrNo: boolean) => {
        let newRelationsString = '';
        if (yesOrNo && !relations.includes(relation))
            newRelationsString = [...relations, relation].join(',');
        else if (!yesOrNo && relations.includes(relation))
            newRelationsString = relations.filter(r => r !== relation).join(',');

        history.push('/packages/' + newRelationsString + '/' + pkgsString);
    };

    return (
        <div className='controls'>
            <strong>Relations:</strong><br/>
            <input type="checkbox" checked={depends} onChange={e => useRelation('depends', e.target.checked)}/>
                <span style={{color: 'red'}}>Depends</span> <br/>
            <input type="checkbox" checked={imports} onChange={e => useRelation('imports', e.target.checked)}/>
                Imports <br/>
            <input type="checkbox" checked={linkingTo} onChange={e => useRelation('linkingTo', e.target.checked)}/>
                Linking To <br/>
            <hr/>
            <a href="https://github.com/tannerntannern/cran-visualizer" target="__blank">Source</a>
        </div>
    );
};
