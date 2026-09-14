const React = require('react');
const ReactDOMServer = require('react-dom/server');

function TestComponent({ query, initialExact }) {
    const [exact, setExact] = React.useState(initialExact);
    
    React.useEffect(() => {
        if (initialExact !== undefined) {
            console.log("Setting exact to", initialExact);
            setExact(initialExact);
        }
    }, [initialExact]);
    
    React.useEffect(() => {
        console.log("Resetting exact to false due to query change");
        setExact(false);
    }, [query]);
    
    console.log("Rendered with exact:", exact);
    return null;
}

// simulate renders
// well, react-dom/server doesn't run useEffects.
