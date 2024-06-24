import xpath from 'xpath';
import { getNodeWithAttribute, returnChildsArray, returnChildsWithoutTextNode } from './utils';


/**
 * Combines the specified nodes from the given document with the provided files.
 * 
 * @param doc - The document node to combine with the files.
 * @param files - An object containing the files to combine, where the keys represent the node paths and the values are arrays of nodes.
 * @param places - An array of strings representing the places where the nodes should be combined.
 * @returns The combined document node.
 * @throws {Error} If a node is not found, if the node is not an object, if multiple nodes are found for a key, or if a node has no appendChild method.
 */
export function combine(doc: Node, files: Record<string, Node[]>, places: string[]): Node {
    Object.keys(files).forEach(key => {

        let isArray = false;
        let key_path = key;
        if (key.split('/').pop() === "*") {
            const p = key.split('/')
            p.pop();
            key_path = p.join('/');
            isArray = true;
        };

        const nodes = xpath.select(key_path, doc);
        if (!nodes) throw new Error(`Node not found: ${key}`);
        if (typeof nodes !== 'object') throw new Error(`Expected array got ${typeof nodes}`);

        //Delete evry childs of the node to be replaced by the new ones
        if (Array.isArray(nodes)) {
            if (nodes.length > 1) throw new Error(`Multiple nodes found for ${key}`);
            if (!nodes[0]) throw new Error(`Node not found: ${key}`);
            if (typeof nodes[0].appendChild === 'undefined') throw new Error('Node has no appendChild method');

            const node = nodes[0];
            if (node.childNodes.length > 0 && isArray) {
                console.debug('Childs:', node.childNodes.length)
                while (node.childNodes.length > 0) {
                    node.removeChild(node.firstChild!);
                }
            }

            console.debug('Remains: ', node.childNodes.length)

            // Using a try catch block to log the key and the error if it occurs
            try {
                if (isArray) {
                    const nodes = files[key].sort((a, b) => {
                        // Ensure we're working with an Element node; If the node is a Document then the first child might be an Element;
                        const childsA = returnChildsWithoutTextNode(a);
                        const childsB = returnChildsWithoutTextNode(b);
                        if (a.nodeType !== a.ELEMENT_NODE) a = childsA[0];
                        if (b.nodeType !== b.ELEMENT_NODE) b = childsB[0];
                        if (!a || !b) return 0;
                        if (a.nodeType !== a.ELEMENT_NODE || b.nodeType !== b.ELEMENT_NODE) return 0;

                        const indexA = places.indexOf(`${key_path.split('/').at(-1)?.toLowerCase()}/${a.nodeName}-${(a as Element).getAttribute('Id')}.xml`);
                        const indexB = places.indexOf(`${key_path.split('/').at(-1)?.toLocaleLowerCase()}/${b.nodeName}-${(b as Element).getAttribute('Id')}.xml`);

                        // If one of the nodes is not found in the places array, then we try to find the group and compare it with the other node
                        if (indexA === -1) {
                            try {
                                const group = getNodeWithAttribute(a, 'TrackGroupId', 'Value');
                                // If group Id is -1 then the track doesn't belong to a group
                                if (group.getAttribute('Value') && group.getAttribute('Value') !== '-1') {
                                    const groupIndex = places.indexOf(`${key_path.split('/').at(-1)?.toLocaleLowerCase()}/GroupTrack-${group.getAttribute('Value')}.xml`);
                                    if (groupIndex !== -1) {
                                        return groupIndex - indexB;
                                    } else throw new Error('Group not found: ' + group.getAttribute('Value'))
                                }
                            } catch (e) {
                                if (e instanceof Error && e.message)
                                    e.message = `${e.message}; Are you sure it is a track?`;
                                throw e;
                            }
                        } else if (indexB === -1) {
                            try {
                                const group = getNodeWithAttribute(b, 'TrackGroupId', 'Value');
                                if (group.getAttribute('Value') && group.getAttribute('Value') !== '-1') {
                                    const groupIndex = places.indexOf(`${key_path.split('/').at(-1)?.toLocaleLowerCase()}/GroupTrack-${group.getAttribute('Value')}.xml`);
                                    if (groupIndex !== -1) {
                                        return indexA - groupIndex;
                                    } else throw new Error('Group not found: ' + group.getAttribute('Value'));
                                }
                            } catch (e) {
                                if (e instanceof Error && e.message)
                                    e.message = `${e.message}; Are you sure it is a track?`;
                                throw e;
                            }

                        };
                        return indexA - indexB;
                    });

                    for (let _node of nodes) {
                        console.debug('Appending:', _node.nodeName, 'to', node.nodeName)
                        node.appendChild(_node);
                    }

                } else {
                    //Simply replace the all things;
                    const parent = node.parentNode;
                    let siblings = node.nextSibling;
                    let _node = files[key][0]; // We're sure that the array has only one element;
                    if (node.nodeType === node.DOCUMENT_NODE) _node = node.firstChild!; // Unwrap the document node;

                    if (!siblings || siblings.nodeType === 3) siblings = node.previousSibling
                    if (!siblings || siblings.nodeType === 3) siblings = returnChildsWithoutTextNode(parent!).find((_n, i, _ns) => {
                        if (i === 0) return false;
                        return _n.nodeName !== node.nodeName && (_ns[i].nodeName === node.nodeName || _ns[i - 1].nodeName === node.nodeName);
                    }) as ChildNode; // Find a next sibling that is not a text node;


                    if (!parent) throw new Error('Parent not found');
                    if (!siblings || siblings.nodeType === 3) throw new Error('No siblings found: ' + returnChildsArray(parent).map(node => node.nodeName));
                    if (!_node) throw new Error('Node not found');

                    console.debug('Parent:', parent?.nodeName, 'Siblings:', siblings?.nodeName, 'Node:', node.nodeName)

                    parent?.removeChild(node);
                    console.debug('Appending:', node.nodeName, 'to', parent?.nodeName)
                    parent?.insertBefore(_node, siblings);
                }
            } catch (e) {
                console.error('Key: ', key, ' isArray:', isArray);
                throw e;
            }
        }

    });
    return doc;
}
