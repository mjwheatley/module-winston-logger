const traverse = require('traverse');

function redact({ info, flow, state, needsRedacting}) {
    needsRedacting = needsRedacting || {};
    if (!needsRedacting[flow] || !needsRedacting[flow][state]) {
        return info;
    }

    if (typeof info == 'string') {
        try {
            info = JSON.parse(info);
        } catch (err) {
            return info;
        }
    }

    if (typeof info == 'object') {
        return traverse(info).map(function (val) {
            if (needsRedacting[flow][state][this.key]) {
                this.update('***')
            }
        });
    }

    return info;
}

module.exports = {
    redact
};
