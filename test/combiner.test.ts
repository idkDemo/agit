import { combine } from '../src/lib/combiner';
import { describe, it, expect } from 'bun:test';
import { parse } from '../src/lib/parser';
import { exists } from 'fs/promises';

describe('combine', () => {
    it('should combine the files into the document', () => {
        // Arrange
        const doc = createDocument();
        const files = {
            '/root/tracks/*': [
                createNode('<track Id="5"><TrackGroupId Value="-1"/></track>'),
                createNode('<track Id="6"><TrackGroupId Value="-1"/></track>'),
                createNode('<track Id="7"><TrackGroupId Value="-1"/></track>'),
                createNode('<track Id="8"><TrackGroupId Value="-1"/></track>')],
            '/root/element': [createNode('<element Id="2"/>')],
        };
        const places = ['track/track-5.xml', 'track/track-6.xml', 'track/track-7.xml', 'track/track-8.xml'];

        // Act
        const result = combine(doc, files, places);

        const filterTextNode = (node: Node) => Array.from(node.childNodes).filter(node => node.nodeType !== 3);

        const root = filterTextNode(result)[0];
        const element = filterTextNode(root)[0];
        const tracks = filterTextNode(root)[1];
        const trackNodes = filterTextNode(tracks);
        // Assert
        expect(result).toEqual(expect.any(Object));
        expect(result.childNodes.length).toBe(2);
        expect(root.nodeName).toBe('root');
        expect(element.nodeName).toBe('element');
        expect((element as Element).getAttribute('Id')).toBe('2');
        expect(trackNodes.length).toBe(4);
        expect(trackNodes[0].nodeName).toBe('track');
        expect((trackNodes[0] as Element).getAttribute('Id')).toBe('5');
        expect(trackNodes[1].nodeName).toBe('track');
        expect((trackNodes[1] as Element).getAttribute('Id')).toBe('6');
        expect(trackNodes[2].nodeName).toBe('track');
        expect((trackNodes[2] as Element).getAttribute('Id')).toBe('7');
        expect(trackNodes[3].nodeName).toBe('track');
        expect((trackNodes[3] as Element).getAttribute('Id')).toBe('8');


    });

    it('should throw an error if the node is not found', () => {
        // Arrange
        const doc = createDocument();
        const files = {
            'key1/track-5.xml': [createNode('<track Id="5"/>')],
        };
        const places = ['key1/track-6.xml'];

        // Act & Assert
        expect(() => combine(doc, files, places)).toThrowError('Node not found: key1/track-5.xml');
    });

    // Add more test cases as needed
});

function createDocument(): Node {
    const xml = `
        <root>
            <element Id="1"></element>
            <tracks></tracks>
        </root>
    `;
    return parse(xml);
}

function createNode(xml: string): Node {
    return parse(xml).firstChild!;
}