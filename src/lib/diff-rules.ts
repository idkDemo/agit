export type Node = Document | ChildNode | Element;
type DiffRule = {
    target: string;
    rule: 'single' | 'children' | 'none'; // Sigle will focus only on the node, multiple will return a conflict if the node or childs return a conflict, all will return a conflict if the node or any child return a conflict, none will ignore the node;
    display: (node: Diff) => string
}

export type DiffRules = {
    _default: DiffRule;
    special: DiffRule[]
}

export type Diff = {
    node: Node;
    rule: DiffRule;

    reason: 'ATTR' | 'TEXT' | 'CHILDREN' | 'NODE' | 'NODE_NAME' | 'NODE_TYPE' | 'VALUE';
    type: 'CHANGE' | 'CREATE' | 'DELETE';
    conflict: boolean;
    x_path: string;
    oursValue?: any;
    theirsValue?: any;
    baseValue?: any;
}

export const AbletonDiffRules: DiffRules = {
    _default: {
        target: 'all',
        rule: 'none',
        display: (diff: Diff) => {
            return `Diff on ${diff.x_path}`;
        }
    },
    special: [
        {
            target: "DeviceChain",
            rule: 'children',
            display: (diff: Diff) => {
                return `Diff on ${diff.x_path}`;
            }
        }
    ]
}