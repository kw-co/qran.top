
// This file is now a barrel file that re-exports icons from categorized files.
// This ensures backward compatibility with existing imports.

export * from './icons/NavigationIcons';
export * from './icons/MediaIcons';
export * from './icons/ActionIcons';
export * from './icons/ContentIcons';
export * from './icons/StatusIcons';
export const ChevronLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);
