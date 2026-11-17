// Lighthouse CI desktop collect (spec 0014, AC-9): the two pages that mount a PDF only from `lg`
// up, on Lighthouse's desktop preset. Run with `lhci collect --additive`, so its results join the
// phone runs; assert and upload read lighthouserc.cjs, which holds every floor.
const { collectBase, desktopUrls } = require('./lighthouserc.cjs');

module.exports = {
    ci: {
        collect: {
            ...collectBase,
            url: desktopUrls,
            settings: {
                preset: 'desktop',
                disableStorageReset: true,
            },
        },
    },
};
