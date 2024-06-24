/**
 * 
 * 
 * 
 * UNUSED FOR NOW; NEEDS REFACTORING AND TESTING TO BE IMPLEMENTED; 
 * 
 * 
 * 
 */

import { type DiffRules, type Node, type Diff } from './diff-rules.ts';
import { build } from './parser.ts';

export namespace Diff3 {
    let rulesSet: DiffRules | null = null;

    /**
     * Calculates the difference between two nodes based on the provided rules.
     * @param opts - The options for calculating the difference.
     * @returns An array of Diff objects representing the differences between the nodes.
     */
    export function diff(opts: { ours: Node, theirs: Node, base: Node, rules: DiffRules }): Diff[] {
        const { ours, theirs, base, rules } = opts;
        rulesSet = rules;
        return travers(ours, theirs, base)
    }

    type Explore = [Node | null, Node | null, Node | null, string];

    function travers(ours: Node, theirs: Node, base: Node): Diff[] {
        if (!rulesSet) throw new Error('Rules not set');
        const queue: Explore[] = [[ours, theirs, base, '']];
        const diffs = [];

        while (queue.length > 0) {
            let [ours, theirs, base, path] = queue.shift() as Explore;

            if (ours === null && theirs === null && base === null) continue;
            if (ours?.nodeType === 3 || theirs?.nodeType === 3 || base?.nodeType === 3) continue;
            if ((ours && !ours.nodeType) || (theirs && !theirs.nodeType) || (base && !base.nodeType)) continue;

            const name = ours?.nodeName ?? theirs?.nodeName ?? base?.nodeName;
            const rule = rulesSet.special.find(e => e.target === name) ?? rulesSet._default;

            console.info('Working on:', name, 'Path:', path, 'Rule:', rule.rule, 'Type:', ours?.nodeType);
            console.debug('Queue:', queue.length);

            const diff = diffNode(ours, theirs, base, path);
            if (ours?.nodeType !== 9 && theirs?.nodeType !== 9 && base?.nodeType !== 9) {
                if (diff) {
                    diffs.push(...diff);
                }
            }

            console.debug('Diff lenght:', diff.length, 'Has create:', diff && diff.filter(e => e.type === 'CREATE').length > 0);
            if (diff && diff.filter(e => e.type === 'CREATE').length > 0) continue

            if (rule.rule === "children") {
                const isConflicting = recursiveExplore(ours, theirs, base);
                if (isConflicting) diffs.push({ type: 'CHANGE', reason: 'CHILDREN', x_path: path + "/" + name, conflict: true });
            }
            else if (rule.rule === "single") {
                //TODO! Implement single rule
            }
            else {
                const max = Math.max(ours && ours.childNodes ? ours.childNodes.length : 0, theirs && theirs.childNodes ? theirs.childNodes.length : 0, base && base.childNodes ? base.childNodes.length : 0);
                console.debug('Queued: ', max, 'childs');

                const tempQueue: Record<string, Explore> = {};

                for (let i = 0; i < max; i++) {

                    const oursChild = ours?.childNodes.item(i) ?? null;
                    const oursChildName = oursChild?.nodeName ?? null;
                    const oursChildId = oursChild?.nodeType === 1 ? (oursChild as Element)?.getAttribute('Id') : null;
                    if (oursChild?.nodeType !== oursChild?.TEXT_NODE) {
                        if (oursChildName) {
                            typeof tempQueue[oursChildName + oursChildId ?? ''] === 'undefined' && (tempQueue[oursChildName + oursChildId ?? ''] = [null, null, null, ''] as Explore);
                            tempQueue[oursChildName + oursChildId ?? ''][0] = ours?.childNodes?.item(i) ?? null
                            if (tempQueue[oursChildName + oursChildId ?? ''][3].length < 1) tempQueue[oursChildName + oursChildId ?? ''][3] = path + "/" + name + (oursChildId ? '[' + i + ']' : '');
                        }
                    }

                    const theirsChild = theirs?.childNodes.item(i) ?? null;
                    const theirsChildName = theirsChild?.nodeName ?? null;
                    const theirsChildId = theirsChild?.nodeType === 1 ? (theirsChild as Element)?.getAttribute('Id') : null;
                    if (theirsChild?.nodeType !== theirsChild?.TEXT_NODE) {
                        if (theirsChildName) {
                            typeof tempQueue[theirsChildName + theirsChildId ?? ''] === 'undefined' && (tempQueue[theirsChildName + theirsChildId ?? ''] = [null, null, null, ''] as Explore);
                            tempQueue[theirsChildName + theirsChildId ?? ''][1] = theirs?.childNodes?.item(i) ?? null
                            if (tempQueue[theirsChildName + theirsChildId ?? ''][3].length < 1) tempQueue[theirsChildName + theirsChildId ?? ''][3] = path + "/" + name + theirsChildId ? '[' + i + ']' : '';
                        }
                    }

                    const baseChild = base?.childNodes.item(i) ?? null;
                    const baseChildName = baseChild?.nodeName ?? null;
                    const baseChildId = baseChild?.nodeType === 1 ? (baseChild as Element)?.getAttribute('Id') : null;
                    if (baseChild?.nodeType !== baseChild?.TEXT_NODE) {
                        if (baseChildName) {
                            typeof tempQueue[baseChildName + baseChildId ?? ''] === 'undefined' && (tempQueue[baseChildName + baseChildId ?? ''] = [null, null, null, ''] as Explore);
                            tempQueue[baseChildName + baseChildId ?? ''][2] = base?.childNodes?.item(i) ?? null
                            if (tempQueue[baseChildName + baseChildId ?? ''][3].length < 1) tempQueue[baseChildName + baseChildId ?? ''][3] = path + "/" + name + (baseChildId ? '[' + i + ']' : '');
                        }
                    }

                    if (ours && oursChildName !== theirsChildName && oursChildId !== theirsChildId) {
                        diffs.push({ type: 'CHANGE', reason: 'ORDER', x_path: path + "/" + name, conflict: true });
                    }

                }
                queue.unshift(...Object.values(tempQueue));
            }
        }

        return diffs.filter(e => e !== undefined) as Diff[];
    }

    function recursiveExplore(ours: Node | null, theirs: Node | null, base: Node | null): boolean {
        const diff = diffNode(ours, theirs, base, '');
        const hasConflict = diff?.filter(e => e.conflict === true);
        if (hasConflict) return true;

        const oursChilds = ours?.childNodes ?? null;
        const theirsChilds = theirs?.childNodes ?? null;
        const baseChilds = base?.childNodes ?? null;

        const max = Math.max(oursChilds?.length ?? 0, theirsChilds?.length ?? 0, baseChilds?.length ?? 0);
        for (let i = 0; i < max; i++) {
            const res = recursiveExplore(oursChilds?.item(i) ?? null, theirsChilds?.item(i) ?? null, baseChilds?.item(i) ?? null);
            console.debug('Recursive:', res, oursChilds?.item(i)?.nodeName, theirsChilds?.item(i)?.nodeName, baseChilds?.item(i)?.nodeName);

            if (res) return res;
        }
        return false;
    }

    function threeWayCond(o: boolean, t: boolean, b: boolean, e?: boolean): { conflict: boolean, change: boolean, from?: 'ours' | 'theirs' } {
        e = typeof e === 'boolean' ? e : false;
        switch (true) {
            case o && t && b: return { conflict: false, change: false }; // Everything is the same
            case !o && !t && b && e: return { conflict: false, change: false }; // Both ours and theirs are null but base is not;
            case !o && !t && b && !e: return { conflict: true, change: true }; // Both ours and theirs are different
            case o && !t && b: return { conflict: true, change: true, from: 'theirs' }; // Only theirs is different
            case !o && t && b: return { conflict: false, change: true, from: 'ours' }; // Only ours is different
            default: return { conflict: false, change: false };
        }
    }

    function makeDiff(res: { conflict: boolean, change: boolean, from?: 'ours' | 'theirs' }, opts: Omit<Diff, 'conflict' | 'node' | 'rule'> & { base: Node | null, ours: Node | null, theirs: Node | null }): Diff | undefined {
        if (!rulesSet) throw new Error('Rules not set');
        let [baseValue, oursValue, theirsValue, type, reason, ours, theirs, base, x_path] = [opts.baseValue, opts.oursValue, opts.theirsValue, opts.type, opts.reason, opts.ours, opts.theirs, opts.base, opts.x_path];
        const { conflict, change } = res;

        if (base === null && ours === null || theirs === null && reason !== "NODE") return;

        if (change) {
            const name = ours?.nodeName ?? theirs?.nodeName ?? base?.nodeName;
            const path = x_path.split('[@')[1] ? x_path : x_path + '/' + name;
            baseValue = baseValue === undefined || baseValue === null ? null : baseValue;
            oursValue = oursValue === undefined || oursValue === null ? null : oursValue;
            theirsValue = theirsValue === undefined || theirsValue === null ? null : theirsValue;

            console.debug('base value', baseValue, 'ours value', oursValue, 'theirs value', theirsValue);

            return {
                type: type, reason, baseValue: baseValue, theirsValue: theirsValue, oursValue: oursValue, x_path: path, conflict, node: (ours ?? theirs ?? base) as Node, rule: rulesSet.special.find(e => e.target === (ours ?? theirs ?? base)?.nodeName) ?? rulesSet._default,
            }

        }
        else
            return undefined;
    }

    function mock(node: Node): Node {
        const obj = Object.create({});
        Object.defineProperties(obj, {
            name: { value: null },
            type: { value: null },
            value: { value: null },
            childNodes: { value: { length: 0 } },
            hasChildNodes: { value: null },
            textContent: { value: null },
            ATTRIBUTE_NODE: { value: node.ATTRIBUTE_NODE },
            ELEMENT_NODE: { value: node.ELEMENT_NODE },
            TEXT_NODE: { value: node.TEXT_NODE },
            DOCUMENT_NODE: { value: node.DOCUMENT_NODE },
            attributes: { value: node.nodeType === node.ELEMENT_NODE ? (node as Element).attributes : { length: 0 } },
        })
        return Object.freeze(obj);
    }

    function diffNode(ours: Node | null, theirs: Node | null, base: Node | null, path: string): Diff[] {
        const diffs = [];

        ours = ours !== null ? ours : mock((base || theirs) as Node);
        theirs = theirs !== null ? theirs : mock((base || ours) as Node);
        base = base !== null ? base : mock((ours || theirs) as Node);

        const createOrDelete = diffCreateDelete(ours, theirs, base, path);
        diffs.push(createOrDelete);

        if (typeof createOrDelete === "undefined") {
            diffs.push(diffNodeName(ours, theirs, base, path));
            diffs.push(diffValue(ours, theirs, base, path));
            diffs.push(diffChildren(ours, theirs, base, path));

            if (ours.nodeType === ours.ELEMENT_NODE) {
                const diff = diffAttributes(ours as Element, theirs as Element, base as Element, path)
                if (diff)
                    diffs.push(...diff);
            }
        };
        return diffs.filter(e => e !== undefined) as Diff[];
    }

    function diffCreateDelete(ours: Node, theirs: Node, base: Node, path: string): Diff | undefined {
        return makeDiff(threeWayCond(
            Object.isFrozen(ours),
            Object.isFrozen(theirs),
            Object.isFrozen(base),
            Object.isFrozen(ours) === Object.isFrozen(theirs),
        ), {
            type: Object.isFrozen(ours) ? 'DELETE' : 'CREATE', reason: 'NODE', x_path: path, base, ours, theirs,
            baseValue: Object.isFrozen(base) ? null : build(base), oursValue: Object.isFrozen(ours) ? null : build(ours), theirsValue: Object.isFrozen(theirs) ? null : build(theirs)
        });
    }

    function diffNodeName(ours: Node, theirs: Node, base: Node, path: string): Diff | undefined {
        return makeDiff(threeWayCond(
            ours.nodeName === base.nodeName,
            theirs.nodeName === base.nodeName,
            base.nodeName === base.nodeName,
            ours.nodeName === theirs.nodeName,
        ), {
            type: 'CHANGE', reason: 'NODE_NAME', x_path: path, base, ours, theirs,
            baseValue: base.nodeName, oursValue: ours.nodeName, theirsValue: theirs.nodeName
        });
    }

    function diffValue(ours: Node, theirs: Node, base: Node, path: string): Diff | undefined {
        let oursValue = ours.childNodes.item ? ours.childNodes.item(0)?.nodeValue ?? null : null;
        let theirsValue = theirs.childNodes.item ? theirs.childNodes.item(0)?.nodeValue ?? null : null;
        let baseValue = base.childNodes.item ? base.childNodes.item(0)?.nodeValue ?? null : null;

        if (oursValue) oursValue = oursValue.replace(/(\r\n|\n|\r|\t)/gm, '');
        if (theirsValue) theirsValue = theirsValue.replace(/(\r\n|\n|\r|\t)/gm, '');
        if (baseValue) baseValue = baseValue.replace(/(\r\n|\n|\r|\t)/gm, '');
        if (!oursValue && !theirsValue && !baseValue) return;
        if (oursValue!.length < 1 && theirsValue!.length < 1 && baseValue!.length < 1) return;

        return makeDiff(threeWayCond(
            oursValue === baseValue,
            theirsValue === baseValue,
            baseValue === baseValue,
            oursValue === theirsValue,
        ), {
            type: 'CHANGE', reason: 'VALUE', x_path: path, base, ours, theirs,
            baseValue, oursValue, theirsValue
        });
    }

    function diffChildren(ours: Node, theirs: Node, base: Node, path: string): Diff | undefined {
        const oursChildCount = ours.childNodes && ours.childNodes.length > 0 ? ours.childNodes.length : 0;
        const theirsChildCount = theirs.childNodes && theirs.childNodes.length > 0 ? theirs.childNodes.length : 0;
        const baseChildCount = base.childNodes && base.childNodes.length > 0 ? base.childNodes.length : 0;

        const max_childs = Math.max(oursChildCount, theirsChildCount, baseChildCount);
        return makeDiff(
            threeWayCond(
                oursChildCount === max_childs,
                theirsChildCount === max_childs,
                baseChildCount === max_childs,
            ), {
            type: 'CHANGE', reason: 'CHILDREN', x_path: path, base, ours, theirs,
            baseValue: baseChildCount, oursValue: oursChildCount, theirsValue: theirsChildCount
        });
    }

    function diffAttributes(ours: Element, theirs: Element, base: Element, path: string): Diff[] | undefined {
        if (ours.nodeType === ours.TEXT_NODE) return;

        const diffs = [];

        const its = ours.attributes.length > theirs.attributes.length ? ours.attributes.length : theirs.attributes.length;
        for (let i = 0; i < its; i++) {
            const attr = ours.attributes.item(0) || theirs.attributes.item(0) || base.attributes.item(0);
            if (!attr) return;

            diffs.push(makeDiff(threeWayCond(
                ours.attributes.getNamedItem(attr.name)?.value === base.attributes.getNamedItem(attr.name)?.value,
                theirs.attributes.getNamedItem(attr.name)?.value === base.attributes.getNamedItem(attr.name)?.value,
                base.attributes.getNamedItem(attr.name)?.value === base.attributes.getNamedItem(attr.name)?.value,
                ours.attributes.getNamedItem(attr.name)?.value === theirs.attributes.getNamedItem(attr.name)?.value,
            ), {
                type: 'CHANGE', reason: 'ATTR', x_path: path + '/' + ours.nodeName + '[@' + attr.name + ']', base, ours, theirs,
                baseValue: base.attributes.getNamedItem(attr.name)?.value,
                oursValue: ours.attributes.getNamedItem(attr.name)?.value,
                theirsValue: theirs.attributes.getNamedItem(attr.name)?.value
            }));
        }
        return diffs.filter(e => e !== undefined);
    }
}