import xpath from "xpath";
import { build } from "./parser";
import type { AbletonFile } from "./paths";

//TODO! Refactor this;
export function split(doc: Document, paths: AbletonFile): [Record<string, string>, string[], Record<string, string>] {
    const mappings: Record<string, string> = {}
    const places: string[] = [];
    const infos: Record<string, string> = {};

    Object.keys(paths.extract).forEach(k => {
        const res = xpath.select((paths.extract[k]), doc);
        if (Array.isArray(res) && res.length > 1) {
            for (let n of res as unknown as Node[]) {
                if (n.nodeType === n.ELEMENT_NODE) {
                    console.debug(n.nodeName, (n as Element).getAttribute('Id'));

                    mappings[`${k}/${n.nodeName}-${(n as Element).getAttribute('Id')}.xml`] = build(n);
                    places.push(`${k}/${n.nodeName}-${(n as Element).getAttribute('Id')}.xml`);
                }
            }
        } else if (Array.isArray(res) && res.length === 1) {
            mappings[`${k}/${res[0].nodeName}.xml`] = build(res[0] as Node);
        }
    })

    Object.keys(paths.infos).forEach(k => {
        const res = xpath.select(paths.infos[k], doc);
        if (Array.isArray(res) && res.length > 1) {
            for (let n of res as unknown as Node[]) {
                if (n.nodeType === n.ELEMENT_NODE) {
                    for (let a = 0; a < (n as Element).attributes.length; a++) {
                        console.debug(`${k}/${a}/${n.nodeName}`, (n as Element).attributes.item(a)?.name, (n as Element).attributes.item(a)?.value);
                        infos[`${k}/${a}/${n.nodeName}`] = (n as Element).attributes.item(a)?.value || '';
                    }
                }
            }
        } else if (Array.isArray(res) && res.length === 1) {
            let node = res[0];

            if (res[0].nodeType !== res[0].ELEMENT_NODE) node = res[0].firstChild!;
            if (node.nodeType !== node.ELEMENT_NODE) throw new Error('Expected element node');

            for (let a = 0; a < (node as Element).attributes.length; a++) {
                console.debug(`${k}/${a}/${node.nodeName}`, (node as Element).attributes.item(a)?.name, (node as Element).attributes.item(a)?.value);
                infos[`${k}/${a}/${node.nodeName}`] = (node as Element).attributes.item(a)?.value || '';
            }
        } else if (res && typeof res === 'object' && !Array.isArray(res) && res.nodeType === res.ELEMENT_NODE) {
            let node = res;
            if (res.nodeType !== res.ELEMENT_NODE) node = res.firstChild!;
            if (node.nodeType !== node.ELEMENT_NODE) throw new Error('Expected element node');
            for (let a = 0; a < (node as Element).attributes.length; a++) {
                console.debug(`${k}/${a}/${node.nodeName}`, (node as Element).attributes.item(a)?.name, (node as Element).attributes.item(a)?.value);
                infos[`${k}/${a}/${node.nodeName}`] = (node as Element).attributes.item(a)?.value || '';
            }
        } else throw new Error('Invalid node or empty;');
    })
    return [mappings, places, infos];
}

