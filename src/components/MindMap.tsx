import React from 'react';
import type { MindMapNode, MindMapData } from '../types/mindmap';

const NodeComponent: React.FC<{
  node: MindMapNode;
  level: number;
}> = ({ node, level }) => {
  const getNodeStyle = (type: MindMapNode['type']) => {
    const baseStyle = "p-3 rounded-lg text-sm transition-all duration-200";
    switch (type) {
      case 'main':
        return `${baseStyle} bg-blue-500/20 text-blue-300 font-semibold`;
      case 'subtopic':
        return `${baseStyle} bg-purple-500/20 text-purple-300`;
      case 'detail':
        return `${baseStyle} bg-green-500/20 text-green-300`;
      default:
        return baseStyle;
    }
  };

  return (
    <div className="relative">
      <div className={`flex flex-col gap-2 ${level > 0 ? 'ml-6' : ''}`}>
        <div className={getNodeStyle(node.type)}>
          {node.label}
        </div>
        {node.children && (
          <div className="flex flex-col gap-2">
            {node.children.map((child) => (
              <NodeComponent
                key={child.id}
                node={child}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const MindMap: React.FC<{
  data: MindMapData;
}> = ({ data }) => {
  return (
    <div className="p-4 glass-card">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-white mb-2">
          {data.metadata.paperTitle}
        </h3>
        {data.metadata.authors && (
          <p className="text-white/70 text-sm">
            Authors: {data.metadata.authors.join(', ')}
          </p>
        )}
        {data.metadata.year && (
          <p className="text-white/70 text-sm">
            Year: {data.metadata.year}
          </p>
        )}
      </div>
      
      <div className="space-y-4">
        {data.nodes
          .filter(node => node.type === 'main')
          .map(node => (
            <NodeComponent
              key={node.id}
              node={node}
              level={0}
            />
          ))}
      </div>
      
      {data.relationships.length > 0 && (
        <div className="mt-6 pt-4 border-t border-white/10">
          <h4 className="text-sm font-medium text-white/70 mb-2">Relationships:</h4>
          <ul className="space-y-1">
            {data.relationships.map((rel, index) => (
              <li key={index} className="text-sm text-white/50">
                {rel.from} → {rel.label ? `${rel.label} →` : ''} {rel.to}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};