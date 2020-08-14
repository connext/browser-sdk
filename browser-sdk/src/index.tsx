import React from 'react';
import ReactDOM from 'react-dom';

function App(props: any) {
    return <div>Hello World!</div>;
}

export default function init(elem: HTMLElement) {
    ReactDOM.render(<App />, elem);
};