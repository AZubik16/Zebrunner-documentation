// Dependencies
// =============================================================================
import { version as pkgVersion } from '../../package.json';
import '../scss/style.scss';


// Constants and variables
// =============================================================================
const commentReplaceMark = 'tabsArticle:replace';
const classNames = {
  tabsArticleContainer  : 'content',
  tabArticleBlock       : 'docsify-tabs-article',
  tabArticleButton      : 'docsify-tabs-article__button',
  tabArticleButtonActive: 'docsify-tabs-article__button--active',
  tabArticleContent     : 'docsify-tabs-article__content'
};
const regex = {
  // Matches markdown code blocks (inline and multi-line)
  // Example: ```text```
  codeMarkup: /(```[\s\S]*?```)/gm,

  // Matches tab replacement comment
  // 0: Match
  // 1: Replacement HTML
  commentReplaceMarkup: new RegExp(`<!-- ${commentReplaceMark} (.*) -->`),

  // Matches tab set by start/end comment
  // 0: Match
  // 1: Indent
  // 2: Start comment: <!-- tabs:start -->
  // 3: Labels and content
  // 4: End comment: <!-- tabs:end -->
  tabArticleBlockMarkup: /[\r\n]*(\s*)(<!-+\s+tabsArticle:\s*?start\s+-+>)[\r\n]+([\s|\S]*?)[\r\n\s]+(<!-+\s+tabsArticle:\s*?end\s+-+>)/m,

  // Matches tab label and content
  // 0: Match
  // 1: Label: <!-- tab:Label -->
  // 2: Content
  tabArticleCommentMarkup: /[\r\n]*(\s*)<!-+\s+tabArticle:\s*(.*)\s+-+>[\r\n]+([\s\S]*?)[\r\n]*\s*(?=<!-+\s+tabsArticle?:)/m,

  // Matches tab label and content
  // 0: Match
  // 1: Label: #### **Label** OR #### __Label__
  // 2: Content
  tabArticleHeadingMarkup: /[\r\n]*(\s*)#{1,6}\s*[*_]{2}\s*(.*[^\s])\s*[*_]{2}[\r\n]+([\s\S]*?)(?=#{1,6}\s*[*_]{2}|<!-+\s+tabsArticle:\s*?end\s+-+>)/m
};
const settings = {
  persist    : true,
  sync       : true,
  theme      : 'classic',
  tabArticleComments: true,
  tabArticleHeadings: true
};


// Functions
// =============================================================================
/**
 * Converts tab content into "stage 1" markup. Stage 1 markup contains temporary
 * comments which are replaced with HTML during Stage 2. This approach allows
 * all markdown to be converted to HTML before tab-specific HTML is added.
 *
 * @param {string} content
 * @returns {string}
 */
function renderTabsStage1(content) {
  const codeBlockMatch   = content.match(regex.codeMarkup) || [];
  const codeBlockMarkers = codeBlockMatch.map((item, i) => {
    const codeMarker = `<!-- ${commentReplaceMark} CODEBLOCK${i} -->`;

    // Replace code block with marker to ensure tab markup within code
    // blocks is not processed. These markers are replaced with their
    // associated code blocs after tabs have been processed.
    content = content.replace(item, () => codeMarker);

    return codeMarker;
  });
  const tabArticleTheme = settings.theme ? `${classNames.tabArticleBlock}--${settings.theme}` : '';

  let tabArticleBlockMatch; // eslint-disable-line no-unused-vars
  let tabArticleMatch; // eslint-disable-line no-unused-vars

  // Process each tab set
  while ((tabArticleBlockMatch = regex.tabArticleBlockMarkup.exec(content)) !== null) {
    let tabArticleBlock            = tabArticleBlockMatch[0];
    let tabArticleStartReplacement = '';
    let tabArticleEndReplacement   = '';

    const hasTabArticleComments = settings.tabArticleComments && regex.tabArticleCommentMarkup.test(tabArticleBlock);
    const hasTabArticleHeadings = settings.tabArticleHeadings && regex.tabArticleHeadingMarkup.test(tabArticleBlock);
    const tabArticleBlockIndent = tabArticleBlockMatch[1];
    const tabArticleBlockStart  = tabArticleBlockMatch[2];
    const tabArticleBlockEnd    = tabArticleBlockMatch[4];

    if (hasTabArticleComments || hasTabArticleHeadings) {
      tabArticleStartReplacement = `<!-- ${commentReplaceMark} <div class="${[classNames.tabArticleBlock, tabArticleTheme].join(' ')}"> -->`;
      tabArticleEndReplacement = `\n${tabArticleBlockIndent}<!-- ${commentReplaceMark} </div> -->`;

      // Process each tab panel
      while ((tabArticleMatch = (settings.tabArticleComments ? regex.tabArticleCommentMarkup.exec(tabArticleBlock) : null) || (settings.tabArticleHeadings ? regex.tabArticleHeadingMarkup.exec(tabArticleBlock) : null)) !== null) {
        const tabArticleTitle   = (tabArticleMatch[2] || '[Tab]').trim();
        const tabArticleContent = (tabArticleMatch[3] || '').trim();

        // Use replace function to avoid regex special replacement
        // strings being processed ($$, $&, $`, $', $n)
        tabArticleBlock = tabArticleBlock.replace(tabArticleMatch[0], () => [
          `\n${tabArticleBlockIndent}<!-- ${commentReplaceMark} <button class="${classNames.tabArticleButton}" data-tab-article="${tabArticleTitle.toLowerCase()}">${tabArticleTitle}</button> -->`,
          `\n${tabArticleBlockIndent}<!-- ${commentReplaceMark} <div class="${classNames.tabArticleContent}" data-tab-article-content="${tabArticleTitle.toLowerCase()}"> -->`,
          `\n\n${tabArticleBlockIndent}${tabArticleContent}`,
          `\n\n${tabArticleBlockIndent}<!-- ${commentReplaceMark} </div> -->`,
        ].join(''));
      }
    }

    tabArticleBlock = tabArticleBlock.replace(tabArticleBlockStart, () => tabArticleStartReplacement);
    tabArticleBlock = tabArticleBlock.replace(tabArticleBlockEnd, () => tabArticleEndReplacement);
    content = content.replace(tabArticleBlockMatch[0], () => tabArticleBlock);
  }

  // Restore code blocks
  codeBlockMarkers.forEach((item, i) => {
    content = content.replace(item, () => codeBlockMatch[i]);
  });

  return content;
}

/**
 * Converts "stage 1" markup into final markup by replacing temporary comments
 * with HTML.
 *
 * @param {string} html
 * @returns {string}
 */
function renderTabsStage2(html) {
  let tabArticleReplaceMatch; // eslint-disable-line no-unused-vars

  while ((tabArticleReplaceMatch = regex.commentReplaceMarkup.exec(html)) !== null) {
    const tabArticleComment     = tabArticleReplaceMatch[0];
    const tabArticleReplacement = tabArticleReplaceMatch[1] || '';

    html = html.replace(tabArticleComment, () => tabArticleReplacement);
  }

  return html;
}

/**
 * Sets the initial active tab for each tab group: the tab containing the
 * matching element ID from the URL, the first tab in the group, or the last tab
 * clicked (if persist option is enabled).
 */
function setDefaultTabs() {
  const tabsArticleContainer     = document.querySelector(`.${classNames.tabsArticleContainer}`);
  const tabArticleBlocks         = tabsArticleContainer ? Array.apply(null, tabsArticleContainer.querySelectorAll(`.${classNames.tabArticleBlock}`)) : [];
  const tabArticleStoragePersist = JSON.parse(sessionStorage.getItem(window.location.href)) || {};
  const tabArticleStorageSync    = JSON.parse(sessionStorage.getItem('*')) || [];

  setActiveTabFromAnchor();

  tabArticleBlocks.forEach((tabArticleBlock, index) => {
    let activeButton = tabArticleBlock.querySelector(`.${classNames.tabArticleButtonActive}`);

    if (!activeButton) {
      if (settings.sync && tabArticleStorageSync.length) {
        activeButton = tabArticleStorageSync
          .map(label => tabArticleBlock.querySelector(`.${classNames.tabArticleButton}[data-tab-article="${label}"]`))
          .filter(elm => elm)[0];
      }

      if (!activeButton && settings.persist) {
        activeButton = tabArticleBlock.querySelector(`.${classNames.tabArticleButton}[data-tab-article="${tabArticleStoragePersist[index]}"]`);
      }

      activeButton = activeButton || tabArticleBlock.querySelector(`.${classNames.tabArticleButton}`);
      activeButton && activeButton.classList.add(classNames.tabArticleButtonActive);
    }
  });
}

/**
 * Sets the active tab within a group. Optionally stores the selection so it can
 * persist across page loads and syncs active state to tabs with same data attr.
 *
 * @param {object} elm Tab toggle element to mark as active
 */
function setActiveTab(elm, _isMatchingTabSync = false) {
  const isTabArticleButton = elm.classList.contains(classNames.tabArticleButton);

  if (isTabArticleButton) {
    const activeButton      = elm;
    const activeButtonLabel = activeButton.getAttribute('data-tab');
    const tabsArticleContainer     = document.querySelector(`.${classNames.tabsArticleContainer}`);
    const tabArticleBlock          = activeButton.parentNode;
    const tabArticleButtons        = Array.apply(null, tabArticleBlock.querySelectorAll(`.${classNames.tabArticleButton}`));
    const tabArticleBlockOffset    = tabArticleBlock.offsetTop;

    tabArticleButtons.forEach(buttonElm => buttonElm.classList.remove(classNames.tabArticleButtonActive));
    activeButton.classList.add(classNames.tabArticleButtonActive);

    if (!_isMatchingTabSync) {
      if (settings.persist) {
        const tabBlocks     = tabsArticleContainer ? Array.apply(null, tabsArticleContainer.querySelectorAll(`.${classNames.tabArticleBlock}`)) : [];
        const tabBlockIndex = tabBlocks.indexOf(tabArticleBlock);
        const tabStorage    = JSON.parse(sessionStorage.getItem(window.location.href)) || {};

        tabStorage[tabBlockIndex] = activeButtonLabel;
        sessionStorage.setItem(window.location.href, JSON.stringify(tabStorage));
      }

      if (settings.sync) {
        const tabArticleButtonMatches = tabsArticleContainer ? Array.apply(null, tabsArticleContainer.querySelectorAll(`.${classNames.tabArticleButton}[data-tab="${activeButtonLabel}"]`)) : [];
        const tabArticleStorage       = JSON.parse(sessionStorage.getItem('*')) || [];

        tabArticleButtonMatches.forEach(tabButtonMatch => {
          setActiveTab(tabButtonMatch, true);
        });

        // Maintain position in viewport when tab group's offset changes
        window.scrollBy(0, 0 - (tabArticleBlockOffset - tabArticleBlock.offsetTop));

        // Remove existing label if not first in array
        if (tabArticleStorage.indexOf(activeButtonLabel) > 0) {
          tabArticleStorage.splice(tabArticleStorage.indexOf(activeButtonLabel), 1);
        }

        // Add label if not already in first position
        if (tabArticleStorage.indexOf(activeButtonLabel) !== 0) {
          tabArticleStorage.unshift(activeButtonLabel);
          sessionStorage.setItem('*', JSON.stringify(tabArticleStorage));
        }
      }
    }
  }
}

/**
 * Sets the active tab based on the anchor ID in the URL
 */
function setActiveTabFromAnchor() {
  const anchorID              = (window.location.hash.match(/(?:id=)([^&]+)/) || [])[1];
  const anchorSelector        = anchorID && `.${classNames.tabArticleBlock} #${anchorID.indexOf('%') > -1 ? decodeURIComponent(anchorID) : anchorID}`;
  const isAnchorElmInTabBlock = anchorID && document.querySelector(anchorSelector);

  if (isAnchorElmInTabBlock) {
    const anchorElm = document.querySelector(`#${anchorID}`);

    let tabArticleContent;

    if (anchorElm.closest) {
      tabArticleContent = anchorElm.closest(`.${classNames.tabArticleContent}`);
    }
    else {
      tabArticleContent = anchorElm.parentNode;

      while (tabArticleContent !== document.body && !tabArticleContent.classList.contains(`${classNames.tabArticleContent}`)) {
        tabArticleContent = tabArticleContent.parentNode;
      }
    }

    setActiveTab(tabArticleContent.previousElementSibling);
  }
}


// Plugin
// =============================================================================
function docsifyTabsArticle(hook, vm) {
  let hasTabsArticle = false;

  hook.beforeEach(function(content) {
    hasTabsArticle = regex.tabArticleBlockMarkup.test(content);

    if (hasTabsArticle) {
      content = renderTabsStage1(content);
    }

    return content;
  });

  hook.afterEach(function(html, next) {
    if (hasTabsArticle) {
      html = renderTabsStage2(html);
    }

    next(html);
  });

  hook.doneEach(function() {
    if (hasTabsArticle) {
      setDefaultTabs();
    }
  });

  hook.mounted(function() {
    const tabsArticleContainer = document.querySelector(`.${classNames.tabsArticleContainer}`);

    tabsArticleContainer && tabsArticleContainer.addEventListener('click', function(evt) {
      setActiveTab(evt.target);
    });

    window.addEventListener('hashchange', setActiveTabFromAnchor, false);
  });
}


if (window) {
  window.$docsify = window.$docsify || {};

  // Add config object
  window.$docsify.tabsArticle = window.$docsify.tabsArticle || {};

  // Update settings based on $docsify config
  Object.keys(window.$docsify.tabsArticle).forEach(key => {
    if (Object.prototype.hasOwnProperty.call(settings, key)) {
      settings[key] = window.$docsify.tabsArticle[key];
    }
  });

  // Add plugin data
  window.$docsify.tabsArticle.version = pkgVersion;

  // Init plugin
  if (settings.tabArticleComments || settings.tabArticleHeadings) {
    window.$docsify.plugins = [].concat(
      docsifyTabsArticle,
      (window.$docsify.plugins || [])
    );
  }
}
