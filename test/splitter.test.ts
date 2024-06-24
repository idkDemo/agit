import { parse } from '../src/lib/parser';
import { split } from '../src/lib/splitter';
import { describe, it, expect } from 'bun:test';

describe('split', () => {
    it('should split the document and return mappings, places, and infos', () => {
        // Arrange
        const doc = parse(`
            <root>
                <info Id="1"></element>
                <element Id="2"></element>
                <Children>
                    <track Id="5"></track>
                    <track Id="6"></track>
                    <track Id="7"></track>
                    <track Id="8"></track>
                </Children>
            </root>
            `);
        const paths = {
            extract: {
                key1: '/root/Children/*',
                key2: '/root/element'
            },
            infos: {
                key3: '/root/info',
            }
        };

        // Act
        const [mappings, places, infos] = split(doc, paths);
        const mappings_check = {
            "key1/track-5.xml": "<track Id=\"5\"/>",
            "key1/track-6.xml": "<track Id=\"6\"/>",
            "key1/track-7.xml": "<track Id=\"7\"/>",
            "key1/track-8.xml": "<track Id=\"8\"/>",
            "key2/element.xml": "<element Id=\"2\"/>",
        }
        const places_check = ["key1/track-5.xml", "key1/track-6.xml", "key1/track-7.xml",
            "key1/track-8.xml"
        ]
        const info_check = {
            "key3/0/info": "1",
        }
        // Assert
        expect(mappings).toEqual(expect.any(Object));
        expect(places).toEqual(expect.any(Array));
        expect(infos).toEqual(expect.any(Object));

        expect(Object.keys(mappings).length).toBe(5);
        expect(places.length).toBe(4);
        expect(Object.keys(infos).length).toBe(1);

        expect(mappings).toEqual(mappings_check);
        expect(places).toEqual(places_check);
        expect(infos).toEqual(info_check);
    });

    it('should throw an error if the node is invalid or empty', () => {
        const doc = parse(`
            <root>
            </root>
            `);
        const paths = {
            extract: {
                key1: '/root/Children/*',
                key2: '/root/element'
            },
            infos: {
                key3: '/root/info',
            }
        };

        expect(() => split(doc, paths)).toThrowError('Invalid node or empty;');
    });
});