export interface MindMapNode {
  id: string;
  label: string;
  type: 'main' | 'subtopic' | 'detail';
  children?: MindMapNode[];
}

export interface MindMapData {
  nodes: MindMapNode[];
  relationships: Array<{
    from: string;
    to: string;
    label?: string;
  }>;
  metadata: {
    paperTitle: string;
    authors?: string[];
    year?: number;
    mainTopic: string;
  };
}