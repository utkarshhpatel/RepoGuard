import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FindingsList } from '../src/components/FindingsList';
import { Finding } from '../src/types';

const mockFindings: Finding[] = [
  {
    id: 'f-1',
    title: 'Zero Division Vulnerability',
    severity: 'high',
    category: 'correctness',
    file_path: 'math.py',
    line_number: 10,
    description: 'Division by zero without guard.',
    evidence: 'return a / b',
    impact: 'Crashes server',
    conditions: 'When b=0',
    suggested_fix: 'if b == 0: raise ValueError()',
    suggested_test: 'def test_zero(): ...',
    confidence_label: 'high',
    source_type: 'deterministic',
    verification_status: 'verified',
  },
  {
    id: 'f-2',
    title: 'Potential Memory Leak',
    severity: 'medium',
    category: 'performance',
    file_path: 'cache.py',
    line_number: 45,
    description: 'Cache grows unbounded.',
    evidence: 'self.cache[k] = v',
    impact: 'OOM in production',
    conditions: 'Over time',
    suggested_fix: 'Use LRU cache',
    suggested_test: 'def test_cache_limit(): ...',
    confidence_label: 'medium',
    source_type: 'ai',
    verification_status: 'verified',
  },
];

describe('FindingsList Component', () => {
  it('renders all findings initially', () => {
    const onToggle = vi.fn();
    render(
      <FindingsList
        findings={mockFindings}
        currentFilter="all"
        expandedId={null}
        onToggleExpand={onToggle}
      />
    );

    expect(screen.getByText('Zero Division Vulnerability')).toBeInTheDocument();
    expect(screen.getByText('Potential Memory Leak')).toBeInTheDocument();
    expect(screen.getByText(/Showing/)).toBeInTheDocument();
  });

  it('filters by high severity correctly', () => {
    const onToggle = vi.fn();
    render(
      <FindingsList
        findings={mockFindings}
        currentFilter="high"
        expandedId={null}
        onToggleExpand={onToggle}
      />
    );

    expect(screen.getByText('Zero Division Vulnerability')).toBeInTheDocument();
    expect(screen.queryByText('Potential Memory Leak')).not.toBeInTheDocument();
  });

  it('filters by deterministic source type correctly', () => {
    const onToggle = vi.fn();
    render(
      <FindingsList
        findings={mockFindings}
        currentFilter="deterministic"
        expandedId={null}
        onToggleExpand={onToggle}
      />
    );

    expect(screen.getByText('Zero Division Vulnerability')).toBeInTheDocument();
    expect(screen.queryByText('Potential Memory Leak')).not.toBeInTheDocument();
  });

  it('expands finding details and shows explanation, evidence, fix, and test', () => {
    const onToggle = vi.fn();
    render(
      <FindingsList
        findings={mockFindings}
        currentFilter="all"
        expandedId="f-1"
        onToggleExpand={onToggle}
      />
    );

    expect(screen.getByText('Division by zero without guard.')).toBeInTheDocument();
    expect(screen.getByText('return a / b')).toBeInTheDocument();
    expect(screen.getByText('if b == 0: raise ValueError()')).toBeInTheDocument();
    expect(screen.getByText('def test_zero(): ...')).toBeInTheDocument();
  });

  it('renders empty state when no findings exist', () => {
    const onToggle = vi.fn();
    render(
      <FindingsList
        findings={[]}
        currentFilter="all"
        expandedId={null}
        onToggleExpand={onToggle}
      />
    );

    expect(
      screen.getByText('No Actionable Defects Identified')
    ).toBeInTheDocument();
  });
});
