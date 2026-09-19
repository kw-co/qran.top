import React from 'react';
import { ScannerResultCard } from './scanner/ScannerResultCard';
import { FlatWord, ExtractionStrategy, ScanDirection } from '../utils/alphabetCipher';

interface ScannerResultItemProps {
    res: {
        L: number;
        R: number;
        length: number;
        targetIndex: number;
        scanMode: 'shortest' | 'forward' | 'backward';
    };
    idx: number;
    flatWords: FlatWord[];
    onOpenInspector?: (startWordIndex: number, strategy: ExtractionStrategy, direction: ScanDirection) => void;
}

export const ScannerResultItem: React.FC<ScannerResultItemProps> = ({
    res,
    idx,
    flatWords,
    onOpenInspector = () => {}
}) => {
    return (
        <ScannerResultCard
            res={res}
            idx={idx}
            flatWords={flatWords}
            onOpenInspector={onOpenInspector}
        />
    );
};

export default ScannerResultItem;
