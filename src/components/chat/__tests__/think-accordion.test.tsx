import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ThinkAccordion } from '../think-accordion';

describe('ThinkAccordion', () => {
    it('renders correctly initially in a closed state', () => {
        const testContent = "This is a test reasoning block.";

        render(<ThinkAccordion content={testContent} />);

        // The trigger button should be visible
        expect(screen.getByText(/Thinking Process/i)).toBeInTheDocument();
    });

    it('toggles the accordion open to reveal the content', async () => {
        const testContent = "This is a test reasoning block inside the accordion.";

        render(<ThinkAccordion content={testContent} />);

        // Click the trigger to open
        const trigger = screen.getByText(/Thinking Process/i);
        fireEvent.click(trigger);

        // The content should now be visible
        expect(await screen.findByText(testContent)).toBeVisible();
    });
});
