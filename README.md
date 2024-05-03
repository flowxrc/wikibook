# wikibook
A simple yet powerful cli for creating wiki documentation.

## Installation
Navigate to your project folder and run the following command:
```sh
npm install wikibook-cli --save-dev
```

## Usage
```js
const wikicli = require("wikibook-cli");
import { wikicli } from "wikibook-cli";

wikicli.build({
    map: "wikimap.json",
    targetDir: "dist"
});
```

### wikimap.json
```json
{
    "title": "My Wiki",
    "pages": "pages",
    "categories": [
        {
            "title": "My Category",
            "pages": [
                { "title": "Events", "contentPath": "page-01.html" }
            ]
        }
    ]
}
```

### pages/page-01.html
```html
<h1>A simple heading!</h1>
<p>Some information here</p>
<code>
    myCodeHere();
</code>
```