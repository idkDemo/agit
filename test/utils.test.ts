import { changeNextPointeeId, getAbletonVersion } from '../src/lib/ableton';
import { parse } from '../src/lib/parser';
import { getNode, getNodeWithAttribute, returnChildsWithoutTextNode } from '../src/lib/utils';
import { describe, it, expect } from 'bun:test';
import xpath from 'xpath';

describe('getAbletonVersion', () => {
  it('should return the Ableton version when given a valid XML document', () => {
    const xml = `
      <Ableton MajorVersion="5" MinorVersion="11.0_11300" SchemaChangeCount="3" Creator="Ableton Live 11.3.10" Revision="76842d592e1d12e4ac43b605fac2016faa8dd0cf">
        <!-- XML content -->
      </Ableton>
    `;
    const doc = parse(xml);

    const expectedVersion = {
      major: 5,
      minor: '11.0_11300',
      revision: '76842d592e1d12e4ac43b605fac2016faa8dd0cf',
      schema: 3
    };

    const version = getAbletonVersion(doc);

    expect(version).toEqual(expectedVersion);
  });

  it('should throw an error if the Ableton version is not found in the XML document', () => {
    const xml = `
      <Root>
        <!-- XML content -->
      </Root>
    `;
    const doc = parse(xml);

    expect(() => {
      getAbletonVersion(doc);
    }).toThrow('Version not found');
  });

  it('should throw an error if the Ableton version is not in the expected format', () => {
    const xml = `
      <Ableton MajorVersion="10" MinorVersion="1.2" Revision="3.4">
        <!-- XML content -->
      </Ableton>
    `;
    const doc = parse(xml);

    expect(() => {
      getAbletonVersion(doc);
    }).toThrow('Version not found');
  });
});

describe('changeNextPointeeId', () => {
  it('should change the value of the NextPointeeId attribute in the project XML', () => {
    const xml = `
      <Ableton>
        <LiveSet>
          <NextPointeeId Value="12345" />
        </LiveSet>
      </Ableton>
    `;
    const doc = parse(xml);

    const updatedDoc = changeNextPointeeId(doc, 54321);

    const updatedNode = xpath.select('/Ableton/LiveSet/NextPointeeId', updatedDoc);
    expect(updatedNode).toHaveLength(1);
    expect((updatedNode[0] as Element).getAttribute('Value')).toEqual('54321');
  });

  it('should throw an error if the NextPointeeId attribute is not found in the project XML', () => {
    const xml = `
      <Ableton>
        <LiveSet>
          <!-- XML content -->
        </LiveSet>
      </Ableton>
    `;
    const doc = parse(xml);

    expect(() => {
      changeNextPointeeId(doc, 54321);
    }).toThrow('NextPointeeId not found');
  });

  it('should throw an error if multiple NextPointeeId attributes are found in the project XML', () => {
    const xml = `
      <Ableton>
        <LiveSet>
          <NextPointeeId Value="12345" />
          <NextPointeeId Value="54321" />
        </LiveSet>
      </Ableton>
    `;
    const doc = parse(xml);

    expect(() => {
      changeNextPointeeId(doc, 54321);
    }).toThrow('Multiple NextPointeeId found');
  });
});

describe('getNodeWithAttribute', () => {
  it('should return the node with the specified name and attribute when found in the XML document', () => {
    const xml = `
      <Root>
        <Node id="1">Node 1</Node>
        <Element id="2">Node 2</Element>
        <Working id="3">Node 3</Working>
      </Root>
    `;
    const doc = parse(xml);

    const node = getNodeWithAttribute(doc, 'Node', 'id');

    expect(node).toBeDefined();
    expect(node.nodeName).toEqual('Node');
    expect((node as Element).getAttribute('id')).toEqual('1');
  });

  it('should throw an error if the node with the specified name and attribute is not found in the XML document', () => {
    const xml = `
      <Root>
        <Node id="1">Node 1</Node>
        <Node id="2">Node 2</Node>
        <Node id="3">Node 3</Node>
      </Root>
    `;
    const doc = parse(xml);

    expect(() => {
      getNodeWithAttribute(doc, 'Node', 'name');
    }).toThrow('Node with attribute name not found');
  });

  it('should throw an error if multiple nodes with the specified name and attribute are found in the XML document', () => {
    const xml = `
      <Root>
        <Node id="1">Node 1</Node>
        <Node id="2">Node 2</Node>
        <Node id="3">Node 3</Node>
        <Node id="4">Node 4</Node>
      </Root>
    `;
    const doc = parse(xml);

    expect(() => {
      getNodeWithAttribute(doc, 'Node', 'id');
    }).toThrow('Multiple Node with attribute id found');
  });
});
describe('returnChildsWithoutTextNode', () => {
  it('should return an array of child nodes without text nodes', () => {
    const xml = `
      <Root>
        <Node>Node 1</Node>
        Text Node
        <Element>Node 2</Element>
        <Working>Node 3</Working>
      </Root>
    `;
    const doc = parse(xml);
    const rootNode = getNode(doc, 'Root');

    const childNodes = returnChildsWithoutTextNode(rootNode);

    expect(childNodes).toHaveLength(3);
    expect(childNodes[0].nodeName).toEqual('Node');
    expect(childNodes[1].nodeName).toEqual('Element');
    expect(childNodes[2].nodeName).toEqual('Working');
  });

  it('should return an empty array if there are no child nodes without text nodes', () => {
    const xml = `
      <Root>
        Text Node 1
        Text Node 2
        Text Node 3
      </Root>
    `;
    const doc = parse(xml);
    const rootNode = getNode(doc, 'Root');

    const childNodes = returnChildsWithoutTextNode(rootNode);

    expect(childNodes).toHaveLength(0);
  });
});
describe('getNode', () => {
  it('should return the node with the specified name when found in the XML document', () => {
    const xml = `
      <Root>
        <Node>Node 1</Node>
        <Element>Node 2</Element>
        <Working>Node 3</Working>
      </Root>
    `;
    const doc = parse(xml);

    const node = getNode(doc, 'Node');

    expect(node).toBeDefined();
    expect(node.nodeName).toEqual('Node');
    expect(node.textContent).toEqual('Node 1');
  });

  it('should throw an error if the node with the specified name is not found in the XML document', () => {
    const xml = `
      <Root>
        <Node>Node 1</Node>
        <Node>Node 2</Node>
        <Node>Node 3</Node>
      </Root>
    `;
    const doc = parse(xml);

    expect(() => {
      getNode(doc, 'Element');
    }).toThrow('Element not found');
  });

  it('should throw an error if multiple nodes with the specified name are found in the XML document', () => {
    const xml = `
      <Root>
        <Node>Node 1</Node>
        <Node>Node 2</Node>
        <Node>Node 3</Node>
        <Node>Node 4</Node>
      </Root>
    `;
    const doc = parse(xml);

    expect(() => {
      getNode(doc, 'Node');
    }).toThrow('Multiple Node found');
  });
});