/// FILE: /Users/dschnare/Documents/Workspace/vanilla/test/support/web/js/lib/c.js

//#import "../a.js"

var C = 'C';

/// FILE: /Users/dschnare/Documents/Workspace/vanilla/test/support/web/js/b.js

//#import "./lib/c.js"

var B = 'B';

/// FILE: /Users/dschnare/Documents/Workspace/vanilla/test/support/web/js/a.js

//#import "./b.js"

var A = 'A';