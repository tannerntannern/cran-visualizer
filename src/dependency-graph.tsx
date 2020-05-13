import React from 'react';
import Graph from 'react-graph-vis';
import { useParams } from 'react-router-dom';

import useDependencyTree from './use-dependency-tree';

export default () => {
    const { pkgs } = useParams();
    const inputPackages = (pkgs as string).split(',');

    const { packages, importsLinks } = useDependencyTree(...inputPackages);

    const _nodes = {};
    packages.forEach(node => _nodes[node] = {
        id: node,
        label: node,
        color: {
            background: inputPackages.includes(node) ? '#A3AF58' : '#F1BB78',
        }
    });

    const nodes = Object.values(_nodes);
    const edges = importsLinks.toArray().map(([from, to]) => ({ from, to, arrows: 'to' }));

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
        <Graph
            graph={graph}
            options={options}
            events={events}
        />
    );
};
