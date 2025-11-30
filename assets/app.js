/**
 * ============================================================================
 * 多立場社會議題地圖 - 前端應用程式主檔案
 * ============================================================================
 * 
 * 【資料檔案結構說明】
 * 
 * 本專案使用以下資料檔案結構（所有檔案位於 data/ 資料夾）：
 * 
 * 1. data/{issueId}.json - 主要議題資料（必需）
 *    結構：
 *    {
 *      "id": "議題唯一識別碼（例如：housing、ai_ethics）",
 *      "title": "議題標題（顯示在頁面上）",
 *      "description": "議題描述（簡短說明此議題的內容）",
 *      "stances": [
 *        {
 *          "id": "立場 ID（例如：government、youth）",
 *          "name": "立場名稱（顯示在卡片標題）",
 *          "summary": "立場摘要說明（顯示在卡片內容）"
 *        }
 *      ],
 *      "nodes": [
 *        {
 *          "id": "節點唯一識別碼（例如：high-price）",
 *          "label": "關鍵字標籤（顯示在網絡圖中，必須與 articles 的 keywords 匹配）",
 *          "group": "群組 ID（gov/government、youth、developer、user、neutral）",
 *          "explanation": "關鍵字說明（點擊節點時顯示）",
 *          "examples": ["例句 1", "例句 2"]
 *        }
 *      ],
 *      "links": [
 *        {
 *          "source": "起始節點 id（必須是 nodes 中某個節點的 id）",
 *          "target": "目標節點 id（必須是 nodes 中某個節點的 id）",
 *          "weight": "連結權重（0.1-1.0，數值越高表示共現頻率越高）"
 *        }
 *      ]
 *    }
 * 
 * 2. data/{issueId}_articles.json - 文章資料（必需）
 *    結構：
 *    {
 *      "articles": [
 *        {
 *          "id": "文章唯一識別碼（建議使用 article_XXX 格式）",
 *          "title": "文章標題（會顯示在文章列表中）",
 *          "source": "來源媒體名稱（例如：某報、某新聞網）",
 *          "date": "發布日期（格式：YYYY-MM-DD）",
 *          "url": "文章原始網址（請使用假網址，例如：https://example.com/article/001）",
 *          "keywords": ["關鍵字1", "關鍵字2"]  // 必須與 nodes 的 label 完全匹配
 *        }
 *      ]
 *    }
 * 
 * 3. data/{issueId}_metadata.json - 元資料（可選）
 *    存放資料來源資訊、更新時間等後設資料，目前未在前端使用，可作為未來擴充用
 * 
 * 4. data/{issueId}_network.json - 網絡圖資料（可選）
 *    可獨立存放 nodes 和 links，目前前端主要從 {issueId}.json 載入，此檔案作為結構參考
 * 
 * ============================================================================
 * 【如何新增新議題】
 * ============================================================================
 * 
 * 步驟 1：建立資料檔案
 *   - 在 data/ 資料夾中建立 {issueId}.json（例如：climate.json）
 *   - 建立對應的 {issueId}_articles.json（例如：climate_articles.json）
 *   - 可選：建立 {issueId}_metadata.json 和 {issueId}_network.json
 * 
 * 步驟 2：在程式碼中註冊新議題
 *   - 在 initIssuePage() 函數的 validIssueIds 陣列中新增議題 ID
 *   - 在 renderDataSourceSection() 函數的 dataSourceInfo 物件中新增議題的資料來源資訊
 * 
 * 步驟 3：在首頁新增連結
 *   - 在 index.html 的議題列表中新增連結（例如：<a href="issue.html?id=climate">）
 * 
 * 步驟 4：測試
 *   - 開啟 index.html，點擊新議題連結
 *   - 確認議題頁面能正常載入並顯示內容
 * 
 * 注意事項：
 *   - keywords 陣列中的關鍵字必須與 nodes 的 label 完全匹配（大小寫、空格都要一致）
 *   - 節點的 group 必須是 GROUP_CONFIG 中已定義的群組 ID
 *   - links 的 source 和 target 必須是 nodes 中有效的節點 id
 *   - URL 請使用假網址（例如：https://example.com/...），避免使用真實新聞連結
 * 
 * ============================================================================
 */

// 網絡圖顯示的節點數量上限（只顯示權重最高的前 N 個節點）
const TOP_N_NODES = 10;

/**
 * 群組配置：統一的顏色和顯示名稱
 * 
 * 此配置定義了不同立場群組的視覺樣式：
 * - gov/government: 政府／主管機關（藍色）
 * - youth: 青年租屋族或首購族（橘色）
 * - developer: 建商與地主（紅色）
 * - user: 使用者或受影響群體（綠色）
 * - neutral: 中立或跨立場關鍵詞（灰色）
 * 
 * 新增議題時，如果使用不同的群組 ID，請在此處新增對應配置
 */
const GROUP_CONFIG = {
    'gov': {
        color: '#3498db',
        displayName: '政府／主管機關'
    },
    'government': {
        color: '#3498db',
        displayName: '政府／主管機關'
    },
    'youth': {
        color: '#e67e22',
        displayName: '青年租屋族或首購族'
    },
    'developer': {
        color: '#e74c3c',
        displayName: '建商與地主／科技公司與開發者'
    },
    'user': {
        color: '#27ae60',  // 綠色 - 不會與其他顏色撞色
        displayName: '使用者或受影響群體'
    },
    'neutral': {
        color: '#95a5a6',
        displayName: '中立或跨立場關鍵詞'
    }
};

/**
 * ============================================================================
 * 資料載入函數
 * ============================================================================
 */

/**
 * 取得 URL 查詢參數
 * @param {string} name - 參數名稱（例如：'id'）
 * @returns {string|null} 參數值，如果不存在則返回 null
 * 
 * 使用範例：
 * - URL: issue.html?id=housing
 * - getQueryParam('id') 返回 'housing'
 */
function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

/**
 * 載入議題主要資料
 * @param {string} issueId - 議題 ID（例如：'housing'、'ai_ethics'）
 * @returns {Promise<Object>} 議題資料物件
 * 
 * 載入的檔案：data/{issueId}.json
 * 
 * 預期資料結構說明：
 * {
 *   id: string,                    // 議題唯一識別碼，必須與檔案名稱一致
 *   title: string,                  // 議題標題，顯示在頁面頂部
 *   description: string,           // 議題描述，顯示在標題下方
 *   stances: [                      // 不同立場的陣列（至少 3 個）
 *     {
 *       id: string,                 // 立場 ID（例如：government、youth）
 *       name: string,                // 立場名稱（顯示在卡片標題）
 *       summary: string             // 立場摘要（顯示在卡片內容）
 *     }
 *   ],
 *   nodes: [                        // 關鍵字節點陣列（建議至少 10 個）
 *     {
 *       id: string,                 // 節點唯一識別碼（例如：high-price）
 *       label: string,               // 關鍵字標籤（顯示在網絡圖中，必須與 articles 的 keywords 匹配）
 *       group: string,               // 群組 ID（gov/government、youth、developer、user、neutral）
 *       explanation: string,         // 關鍵字說明（點擊節點時顯示）
 *       examples: [string]           // 例句陣列（點擊節點時顯示）
 *     }
 *   ],
 *   links: [                        // 節點之間的連結關係陣列
 *     {
 *       source: string,              // 起始節點 id（必須是 nodes 中某個節點的 id）
 *       target: string,              // 目標節點 id（必須是 nodes 中某個節點的 id）
 *       weight: number               // 連結權重（0.1-1.0，數值越高表示共現頻率越高）
 *     }
 *   ]
 * }
 */
async function loadIssueData(issueId) {
    try {
        const response = await fetch(`data/${issueId}.json`);
        if (!response.ok) {
            throw new Error(`無法載入議題資料: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('載入資料時發生錯誤:', error);
        throw error;
    }
}

/**
 * 載入文章資料
 * @param {string} issueId - 議題 ID
 * @returns {Promise<Object>} 文章資料物件，格式：{ articles: Array }
 * 
 * 載入的檔案：data/{issueId}_articles.json
 * 
 * 預期資料結構說明：
 * {
 *   articles: [                     // 文章陣列
 *     {
 *       id: string,                  // 文章唯一識別碼（建議使用 article_XXX 格式）
 *       title: string,               // 文章標題（顯示在文章列表中，可點擊）
 *       source: string,              // 來源媒體名稱（例如：某報、某新聞網）
 *       date: string,                // 發布日期（格式：YYYY-MM-DD）
 *       url: string,                 // 文章原始網址（請使用假網址，例如：https://example.com/article/001）
 *       keywords: [string]           // 相關關鍵字陣列（必須與 nodes 的 label 完全匹配，大小寫、空格都要一致）
 *     }
 *   ]
 * }
 * 
 * 重要注意事項：
 * - keywords 陣列中的關鍵字必須與 {issueId}.json 中 nodes 的 label 完全匹配
 * - 當使用者點擊網絡圖中的節點時，系統會自動篩選出包含該節點關鍵字的所有文章
 * - 如果檔案不存在，會返回空陣列而不會報錯（方便開發階段）
 */
async function loadArticlesData(issueId) {
    try {
        const response = await fetch(`data/${issueId}_articles.json`);
        if (!response.ok) {
            // 如果檔案不存在，返回空陣列
            return { articles: [] };
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('載入文章資料時發生錯誤:', error);
        return { articles: [] };
    }
}

/**
 * ============================================================================
 * 渲染函數 - 將資料轉換為 HTML
 * ============================================================================
 */

/**
 * 渲染立場卡片
 * @param {Array} stances - 立場陣列
 * @returns {string} HTML 字串
 * 
 * 每個立場物件應包含：
 * - id: 立場唯一識別碼
 * - name: 立場名稱（顯示在卡片標題）
 * - summary: 立場摘要說明（顯示在卡片內容）
 */
function renderStances(stances) {
    if (!stances || stances.length === 0) {
        return '<p>暫無立場資料</p>';
    }
    
    return stances.map(stance => `
        <div class="stance-card">
            <div class="stance-name">${stance.name}</div>
            <div class="stance-summary">${stance.summary}</div>
        </div>
    `).join('');
}

// 顯示關鍵詞詳細資訊
function showKeywordDetails(node, articles = []) {
    const keywordTitleDiv = document.getElementById('keyword-title');
    const keywordExplanationDiv = document.getElementById('keyword-explanation');
    const keywordExamplesDiv = document.getElementById('keyword-examples');
    const relatedArticlesDiv = document.getElementById('related-articles');
    
    if (!node) {
        // 重置為初始狀態
        if (keywordTitleDiv) {
            keywordTitleDiv.textContent = '請在上方圖中點選一個關鍵詞節點。';
        }
        if (keywordExplanationDiv) {
            keywordExplanationDiv.textContent = '';
            keywordExplanationDiv.style.display = 'none';
        }
        if (keywordExamplesDiv) {
            keywordExamplesDiv.innerHTML = '';
            keywordExamplesDiv.style.display = 'none';
        }
        if (relatedArticlesDiv) {
            relatedArticlesDiv.innerHTML = '';
            relatedArticlesDiv.style.display = 'none';
        }
        return;
    }
    
    // 顯示關鍵詞標題
    if (keywordTitleDiv) {
        keywordTitleDiv.textContent = node.label;
    }
    
    // 顯示說明
    if (keywordExplanationDiv) {
        if (node.explanation) {
            keywordExplanationDiv.textContent = node.explanation;
            keywordExplanationDiv.style.display = 'block';
        } else {
            keywordExplanationDiv.textContent = '';
            keywordExplanationDiv.style.display = 'none';
        }
    }
    
    // 顯示例句
    if (keywordExamplesDiv) {
        keywordExamplesDiv.innerHTML = '';
        if (node.examples && Array.isArray(node.examples) && node.examples.length > 0) {
            node.examples.forEach(example => {
                const li = document.createElement('li');
                li.textContent = example;
                keywordExamplesDiv.appendChild(li);
            });
            keywordExamplesDiv.style.display = 'block';
        } else {
            keywordExamplesDiv.style.display = 'none';
        }
    }
    
    // 顯示相關文章列表
    if (relatedArticlesDiv) {
        const relatedArticles = findRelatedArticles(node.label, articles);
        renderRelatedArticles(relatedArticles, relatedArticlesDiv);
    }
}

/**
 * 找出與關鍵字相關的文章
 * @param {string} keyword - 關鍵字（必須與 nodes 的 label 完全匹配）
 * @param {Array} articles - 文章陣列
 * @returns {Array} 包含該關鍵字的文章陣列
 * 
 * 匹配邏輯：
 * 1. 完全匹配：article.keywords 中包含與 keyword 完全相同的字串
 * 2. 部分匹配：keyword 包含在 article.keywords 中，或反之
 * 
 * 注意：為了確保準確性，建議在 housing_articles.json 中的 keywords 
 *       與 housing.json 中 nodes 的 label 完全一致
 */
function findRelatedArticles(keyword, articles) {
    if (!articles || articles.length === 0) {
        return [];
    }
    
    return articles.filter(article => {
        if (!article.keywords || !Array.isArray(article.keywords)) {
            return false;
        }
        // 精確匹配或包含匹配
        return article.keywords.some(k => {
            // 完全匹配
            if (k === keyword) return true;
            // 關鍵字包含在文章關鍵字中，或文章關鍵字包含在關鍵字中
            if (k.includes(keyword) || keyword.includes(k)) return true;
            return false;
        });
    });
}

// 渲染相關文章列表
function renderRelatedArticles(articles, container) {
    if (!container) {
        return;
    }
    
    if (articles.length === 0) {
        container.innerHTML = '<p class="no-articles">暫無相關文章（或資料尚待補充）</p>';
        container.style.display = 'block';
        return;
    }
    
    const articlesHtml = articles.map(article => `
        <div class="article-item">
            <h4 class="article-title">
                <a href="${article.url}" target="_blank" rel="noopener noreferrer">${article.title}</a>
            </h4>
            <div class="article-meta">
                <div class="article-meta-row">
                    <span class="article-source"><strong>來源：</strong>${article.source || '未標註'}</span>
                    <span class="article-date"><strong>日期：</strong>${article.date || '未標註'}</span>
                </div>
                <div class="article-url-row">
                    <span class="article-url-label"><strong>原文網址：</strong></span>
                    <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="article-url-link" title="${article.url}">${article.url}</a>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = `
        <h4>相關原始文章列表（${articles.length} 篇）</h4>
        <div class="articles-list">
            ${articlesHtml}
        </div>
    `;
    container.style.display = 'block';
}

// 渲染圖例（legend）
function renderLegend(nodes) {
    if (!nodes || nodes.length === 0) {
        return '';
    }
    
    // 收集所有出現的群組
    const groupsSet = new Set();
    nodes.forEach(node => {
        if (node.group) {
            groupsSet.add(node.group);
        }
    });
    
    // 處理 gov 和 government 的對應關係（避免重複顯示）
    const normalizedGroups = new Set();
    groupsSet.forEach(group => {
        if (group === 'government') {
            normalizedGroups.add('gov');  // 統一使用 'gov'
        } else {
            normalizedGroups.add(group);
        }
    });
    
    // 依群組順序排列
    const groupOrder = ['gov', 'youth', 'developer', 'user', 'neutral'];
    const sortedGroups = groupOrder.filter(g => normalizedGroups.has(g));
    
    // 添加其他未定義的群組
    normalizedGroups.forEach(group => {
        if (!groupOrder.includes(group)) {
            sortedGroups.push(group);
        }
    });
    
    // 生成 legend HTML
    const legendItems = sortedGroups.map(group => {
        const config = GROUP_CONFIG[group];
        if (!config) return '';
        
        return `
            <div class="legend-item">
                <span class="legend-color" style="background-color: ${config.color};"></span>
                <span class="legend-text">${config.displayName}</span>
            </div>
        `;
    }).filter(item => item !== '').join('');
    
    return `
        <div class="network-legend">
            ${legendItems}
        </div>
    `;
}

// 渲染關鍵詞列表
function renderKeywordList(nodes, stances) {
    if (!nodes || nodes.length === 0) {
        return '<p>暫無關鍵詞資料</p>';
    }
    
    // 依群組分類節點
    const nodesByGroup = {};
    nodes.forEach(node => {
        if (!nodesByGroup[node.group]) {
            nodesByGroup[node.group] = [];
        }
        nodesByGroup[node.group].push(node);
    });
    
    // 依群組順序排列（gov/government, youth, developer, user, neutral）
    const groupOrder = ['gov', 'government', 'youth', 'developer', 'user', 'neutral'];
    const sortedGroups = groupOrder.filter(g => nodesByGroup[g]);
    
    // 添加其他未定義的群組
    Object.keys(nodesByGroup).forEach(group => {
        if (!groupOrder.includes(group)) {
            sortedGroups.push(group);
        }
    });
    
    let html = '<div class="keyword-list-container">';
    
    sortedGroups.forEach(group => {
        const groupDesc = getGroupDescription(group, stances);
        html += `
            <div class="keyword-group-section">
                <h4 class="keyword-group-title">${groupDesc}</h4>
                <div class="keyword-cards">
                    ${nodesByGroup[group].map(node => `
                        <div class="keyword-card" data-node-id="${node.id}">
                            <span class="keyword-name">${node.label}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// 初始化關鍵詞列表的點擊事件處理
function initKeywordListClickHandlers(nodes, articles = []) {
    // 建立節點 ID 到節點物件的對應
    const nodeMap = {};
    nodes.forEach(node => {
        nodeMap[node.id] = node;
    });
    
    // 使用事件委派，綁定到列表容器上，這樣即使 DOM 動態更新也能正常工作
    const listView = document.getElementById('list-view');
    if (!listView) {
        // 如果找不到容器，延遲重試
        setTimeout(() => {
            initKeywordListClickHandlers(nodes, articles);
        }, 100);
        return;
    }
    
    // 移除舊的事件監聽器（如果之前已經綁定過）
    if (listView._keywordClickHandler) {
        listView.removeEventListener('click', listView._keywordClickHandler);
    }
    
    // 建立新的事件處理函式
    listView._keywordClickHandler = function(event) {
        // 檢查點擊的是否為關鍵詞卡片或其子元素
        const card = event.target.closest('.keyword-card[data-node-id]');
        if (card) {
            const nodeId = card.getAttribute('data-node-id');
            const node = nodeMap[nodeId];
            if (node) {
                showKeywordDetails(node, articles);
            }
        }
    };
    
    // 為列表容器綁定點擊事件（事件委派）
    listView.addEventListener('click', listView._keywordClickHandler);
    
    // 為所有關鍵詞卡片添加游標樣式提示可點擊
    const keywordCards = listView.querySelectorAll('.keyword-card[data-node-id]');
    keywordCards.forEach(card => {
        card.style.cursor = 'pointer';
    });
}

// 根據群組取得顏色
function getGroupColor(group) {
    return GROUP_CONFIG[group]?.color || '#95a5a6';
}

// 根據群組取得立場描述
function getGroupDescription(group, stances) {
    return GROUP_CONFIG[group]?.displayName || '中立或跨立場關鍵詞';
}

// 轉換節點資料為 vis-network 格式
function convertNodesToVisFormat(nodes) {
    if (!nodes || nodes.length === 0) {
        return [];
    }
    
    return nodes.map(node => ({
        id: node.id,
        label: node.label,  // 保留完整標籤用於 tooltip
        group: node.group,
        // 儲存完整資訊供 hover 時使用
        title: node.label,  // vis-network 的 tooltip
        color: {
            background: getGroupColor(node.group),
            border: getGroupColor(node.group),
            highlight: {
                background: getGroupColor(node.group),
                border: '#2c3e50'
            }
        },
        font: {
            size: 11,  // 縮小字體以減少重疊
            color: '#2c3e50'
        },
        // 初始狀態不顯示標籤，hover 時才顯示
        labelHighlightBold: false
    }));
}

// 計算節點的權重（weighted degree：所有連接到該節點的邊的權重總和）
function calculateNodeWeights(nodes, links) {
    const nodeWeights = {};
    
    // 初始化所有節點的權重為 0
    nodes.forEach(node => {
        nodeWeights[node.id] = 0;
    });
    
    // 如果節點有 weight 屬性，使用它；否則計算連線權重總和
    nodes.forEach(node => {
        if (node.weight !== undefined && node.weight !== null) {
            nodeWeights[node.id] = node.weight;
        } else {
            // 計算所有連接到該節點的邊的權重總和
            links.forEach(link => {
                const weight = link.weight || 1;
                if (link.source === node.id) {
                    nodeWeights[node.id] += weight;
                }
                if (link.target === node.id) {
                    nodeWeights[node.id] += weight;
                }
            });
        }
    });
    
    return nodeWeights;
}

// 過濾節點：選出最重要的前 N 個節點
function filterTopNodes(nodes, links) {
    if (!nodes || nodes.length === 0) {
        return { topNodes: [], filteredLinks: [] };
    }
    
    // 如果節點數量少於或等於 TOP_N_NODES，直接返回所有節點
    if (nodes.length <= TOP_N_NODES) {
        return { topNodes: nodes, filteredLinks: links || [] };
    }
    
    // 計算每個節點的權重
    const nodeWeights = calculateNodeWeights(nodes, links || []);
    
    // 根據權重排序節點（降序）
    const sortedNodes = [...nodes].sort((a, b) => {
        const weightA = nodeWeights[a.id] || 0;
        const weightB = nodeWeights[b.id] || 0;
        return weightB - weightA;
    });
    
    // 選出前 N 個節點
    const topNodes = sortedNodes.slice(0, TOP_N_NODES);
    const topNodeIds = new Set(topNodes.map(n => n.id));
    
    // 過濾連線：只保留連接選中節點的連線
    const filteredLinks = (links || []).filter(link => 
        topNodeIds.has(link.source) && topNodeIds.has(link.target)
    );
    
    return { topNodes, filteredLinks };
}

// 轉換連結資料為 vis-network 格式
function convertLinksToVisFormat(links) {
    if (!links || links.length === 0) {
        return [];
    }
    
    return links.map((link, idx) => ({
        id: `edge_${idx}`,  // 為每個連線設定唯一 ID，方便後續更新
        from: link.source,
        to: link.target,
        value: link.weight || 1,
        width: (link.weight || 1) * 2,
        color: {
            color: '#95a5a6',
            highlight: '#2c3e50'
        }
    }));
}

// 建立網絡圖
function createNetworkGraph(nodes, links, stances, articles = []) {
    const networkContainer = document.getElementById('network');
    if (!networkContainer) {
        return;
    }
    
    // 過濾節點：只選出最重要的前 N 個節點用於網絡圖
    const { topNodes, filteredLinks } = filterTopNodes(nodes, links);
    
    const visNodes = new vis.DataSet(convertNodesToVisFormat(topNodes));
    const visEdges = new vis.DataSet(convertLinksToVisFormat(filteredLinks));
    
    const data = {
        nodes: visNodes,
        edges: visEdges
    };
    
    const options = {
        // 物理模擬設定：只在初始化時穩定一次，之後關閉持續動畫
        physics: {
            enabled: true,  // 先啟用以進行初始穩定
            stabilization: {
                enabled: true,
                iterations: 500,  // 增加迭代次數以確保充分穩定
                updatePhysics: false  // 穩定完成後不再更新物理模擬，停止持續動畫
            },
            barnesHut: {
                gravitationalConstant: -2000,
                centralGravity: 0.3,
                springLength: 95,
                springConstant: 0.04,
                damping: 0.09
            }
        },
        nodes: {
            shape: 'dot',
            size: 20,
            font: {
                size: 11,  // 縮小字體以減少標籤重疊
                face: 'Arial',
                align: 'center'
            },
            borderWidth: 2,
            // 使用較小的標籤字體
            scaling: {
                label: {
                    enabled: true,
                    min: 10,
                    max: 12
                }
            }
        },
        edges: {
            smooth: {
                type: 'continuous',
                roundness: 0.5
            },
            arrows: {
                to: {
                    enabled: false
                }
            }
        },
        // 互動設定：關閉節點拖動，保留縮放和整體視圖拖動
        interaction: {
            hover: true,
            tooltipDelay: 100,
            zoomView: true,  // 保留縮放功能
            dragView: true,  // 保留整體視圖拖動（拖動背景）
            dragNodes: false  // 關閉節點拖動功能，節點位置固定
        }
    };
    
    const network = new vis.Network(networkContainer, data, options);
    
    // 監聽穩定完成事件，穩定後完全關閉物理模擬以確保不再動畫
    network.on('stabilizationEnd', function() {
        network.setOptions({ physics: { enabled: false } });
    });
    
    // 建立節點資訊顯示區域
    const nodeInfoDiv = document.getElementById('node-info');
    const keywordHoverInfoDiv = document.getElementById('keyword-hover-info');
    
    // 用於追蹤是否已點擊節點，避免點擊後 hover 事件立即顯示提示
    let isNodeClicked = false;
    
    // 儲存所有節點和連線的原始狀態，用於恢復（使用過濾後的節點和連線）
    const allNodeIds = topNodes.map(n => n.id);
    const allEdgeIds = filteredLinks.map((l, idx) => `edge_${idx}`);
    
    // 儲存原始節點資料供 hover 時查找（使用過濾後的節點）
    const nodeMap = {};
    topNodes.forEach(node => {
        nodeMap[node.id] = node;
    });
    
    // 滑鼠移到節點上時：顯示資訊並高亮相關節點與連線
    network.on('hoverNode', function(params) {
        // 如果已經點擊了節點，不顯示 hover 提示
        if (isNodeClicked) {
            return;
        }
        
        const nodeId = params.node;
        const node = nodeMap[nodeId];
        
        if (node) {
            const groupDesc = getGroupDescription(node.group, stances);
            
            // 在 keyword-hover-info 區塊顯示資訊（hover 時的小提示）
            if (keywordHoverInfoDiv) {
                keywordHoverInfoDiv.innerHTML = `
                    <div class="keyword-info-content">
                        <strong class="keyword-label">${node.label}</strong>
                        <p class="keyword-group">${groupDesc}</p>
                    </div>
                `;
                keywordHoverInfoDiv.style.display = 'block';
            }
            
            // 找出與該節點相關的連線 ID（使用過濾後的連線）
            const relatedEdgeIds = filteredLinks
                .map((link, idx) => ({
                    id: `edge_${idx}`,
                    edge: link
                }))
                .filter(item => 
                    item.edge.source === nodeId || item.edge.target === nodeId
                )
                .map(item => item.id);
            
            // 找出與該節點相連的其他節點（使用過濾後的連線）
            const relatedNodes = new Set();
            relatedNodes.add(nodeId);
            filteredLinks.forEach(link => {
                if (link.source === nodeId) {
                    relatedNodes.add(link.target);
                }
                if (link.target === nodeId) {
                    relatedNodes.add(link.source);
                }
            });
            
            // 高亮相關節點和連線，淡化其他節點和連線
            const updateNodes = allNodeIds.map(id => {
                const isRelated = relatedNodes.has(id);
                return {
                    id: id,
                    opacity: isRelated ? 1 : 0.2,  // 非相關節點變淡
                    font: {
                        color: isRelated ? '#2c3e50' : '#cccccc'
                    }
                };
            });
            
            const updateEdges = allEdgeIds.map(edgeId => {
                const isRelated = relatedEdgeIds.includes(edgeId);
                return {
                    id: edgeId,
                    opacity: isRelated ? 1 : 0.1,  // 非相關連線變淡
                    color: {
                        color: isRelated ? '#2c3e50' : '#e0e0e0',
                        highlight: '#2c3e50'
                    }
                };
            });
            
            visNodes.update(updateNodes);
            visEdges.update(updateEdges);
        }
    });
    
    // 滑鼠離開節點時：恢復所有節點和連線的原始狀態
    network.on('blurNode', function(params) {
        // 如果已經點擊了節點，不處理 blur 事件
        if (isNodeClicked) {
            return;
        }
        
        // 恢復所有節點
        const resetNodes = allNodeIds.map(id => ({
            id: id,
            opacity: 1,
            font: {
                color: '#2c3e50'
            }
        }));
        
        // 恢復所有連線
        const resetEdges = allEdgeIds.map(edgeId => ({
            id: edgeId,
            opacity: 1,
            color: {
                color: '#95a5a6',
                highlight: '#2c3e50'
            }
        }));
        
        visNodes.update(resetNodes);
        visEdges.update(resetEdges);
        
        // 隱藏關鍵詞資訊（hover 提示）
        if (keywordHoverInfoDiv) {
            keywordHoverInfoDiv.style.display = 'none';
        }
    });
    
    // 點選節點時顯示資訊（保留原有功能，並新增說明區塊顯示）
    network.on('click', function(params) {
        if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            const node = nodeMap[nodeId];
            if (node) {
                // 標記已點擊節點，防止 hover 事件顯示提示
                isNodeClicked = true;
                
                // 強制關閉 hover 提示卡片
                if (keywordHoverInfoDiv) {
                    keywordHoverInfoDiv.style.display = 'none';
                    keywordHoverInfoDiv.innerHTML = '';
                }
                
                // 保留原有的 node-info 顯示
                if (nodeInfoDiv) {
                    const groupDesc = getGroupDescription(node.group, stances);
                    nodeInfoDiv.innerHTML = `
                        <div class="node-info-content">
                            <strong>${node.label}</strong>
                            <p class="node-info-group">${groupDesc}</p>
                        </div>
                    `;
                    nodeInfoDiv.style.display = 'block';
                }
                
                // 使用統一的函式顯示關鍵詞說明
                const articles = window.articlesData || window.networkData?.articles || [];
                showKeywordDetails(node, articles);
            }
        } else {
            // 點選空白處時重置狀態
            isNodeClicked = false;
            
            // 隱藏資訊
            if (nodeInfoDiv) {
                nodeInfoDiv.style.display = 'none';
            }
            
            // 重置關鍵詞說明區塊
            showKeywordDetails(null);
        }
    });
    
    return network;
}

// 計算文章資料統計
function calculateArticleStats(articles) {
    if (!articles || articles.length === 0) {
        return {
            articleCount: 0,
            sourceCount: 0,
            sources: []
        };
    }
    
    // 計算不重複的來源數量
    const sourcesSet = new Set();
    articles.forEach(article => {
        if (article.source) {
            sourcesSet.add(article.source);
        }
    });
    
    return {
        articleCount: articles.length,
        sourceCount: sourcesSet.size,
        sources: Array.from(sourcesSet)
    };
}

/**
 * 渲染資料來源與研究方法區塊
 * @param {string} issueId - 議題 ID（例如：'housing'、'ai_ethics'）
 * @param {Array} articles - 文章陣列（用於計算統計資料）
 * @returns {string} HTML 字串
 * 
 * 此函數的功能：
 * 1. 根據 issueId 從 dataSourceInfo 取得預設資料來源資訊
 * 2. 從實際文章資料計算統計資訊（文章數量、來源數量）
 * 3. 渲染包含資料來源、研究方法說明的區塊
 * 
 * 【新增議題時的重要步驟】
 * 請在此函數的 dataSourceInfo 物件中註冊新議題的資料來源資訊
 */
function renderDataSourceSection(issueId, articles = []) {
    /**
     * 議題資料來源資訊配置物件
     * 
     * 此物件儲存每個議題的資料來源資訊，用於在「資料來源與研究方法」區塊中顯示
     * 
     * 新增議題的步驟：
     * 1. 在此物件中新增一個屬性，key 為議題 ID（例如：'climate'）
     * 2. 填入對應的資料來源資訊：
     *    - sourceTypes: 資料來源類型陣列（例如：['新聞報導', '研究報告']）
     *    - platforms: 來源平台陣列（例如：['某報', '某研究機構']）
     *    - timeRange: 資料時間範圍（例如：'2023-2025'）
     *    - lastUpdated: 資料最後更新時間（格式：'YYYY-MM-DD'）
     * 
     * 範例：
     * 'climate': {
     *   sourceTypes: ['新聞報導', '研究報告', '政策文件'],
     *   platforms: ['某報', '某研究機構', '某政府公開資料平台'],
     *   timeRange: '2023-2025',
     *   lastUpdated: '2025-01-24'
     * }
     * 
     * 注意：文章數量和來源數量會從實際載入的 articles 資料自動計算
     */
    const dataSourceInfo = {
        'housing': {
            sourceTypes: ['新聞報導', '評論文章', '政策文件', 'NGO 報告'],
            platforms: ['某報', '某新聞網', '某政府公開資料平台', '某NGO組織'],
            timeRange: '2023-2025',
            lastUpdated: '2025-01-24'
        },
        'ai_ethics': {
            sourceTypes: ['新聞報導', '評論文章', '政策文件'],
            platforms: ['某報', '某新聞網', '某政府公開資料平台'],
            timeRange: '2023-2025',
            lastUpdated: '2025-01-24'
        }
    };
    
    const info = dataSourceInfo[issueId] || dataSourceInfo['housing'];
    
    // 從實際文章資料計算統計資訊
    const stats = calculateArticleStats(articles);
    const articleCount = stats.articleCount > 0 ? stats.articleCount : info.articleCount || 0;
    const sourceCount = stats.sourceCount > 0 ? stats.sourceCount : (stats.sources.length > 0 ? stats.sources.length : info.platforms.length);
    
    return `
        <section class="data-source-section">
            <h3>資料來源與研究方法</h3>
            <div class="data-source-card">
                <div class="data-source-info">
                    <div class="info-item info-item-highlight">
                        <strong>資料筆數：</strong>
                        <span>共 ${articleCount} 篇文章</span>
                    </div>
                    <div class="info-item info-item-highlight">
                        <strong>來源數量：</strong>
                        <span>共 ${sourceCount} 個不同來源</span>
                    </div>
                    <div class="info-item">
                        <strong>資料來源類型：</strong>
                        <span>${info.sourceTypes.join('、')}</span>
                    </div>
                    <div class="info-item">
                        <strong>來源平台：</strong>
                        <span>${info.platforms.join('、')}</span>
                    </div>
                    <div class="info-item">
                        <strong>資料時間範圍：</strong>
                        <span>${info.timeRange}</span>
                    </div>
                    <div class="info-item">
                        <strong>資料最後更新時間：</strong>
                        <span>${info.lastUpdated}</span>
                    </div>
                </div>
                <div class="methodology-info">
                    <h4>研究方法說明</h4>
                    <p>
                        本專案使用文字探勘（Text Mining）技術從大量文本中萃取與議題相關的關鍵字與概念（如租金、囤房、社宅、青年租屋、房東、仲介、法規等），並運用社會網絡分析（Social Network Analysis）建立關鍵字共現網絡，觀察不同立場與問題聚集的結構性特徵。透過計算關鍵字在同一篇文章或同一段論述中的共現頻率，我們能夠識別出議題中的核心概念群組，以及不同立場之間的關聯性與差異。
                    </p>
                </div>
            </div>
        </section>
    `;
}

// 渲染研究說明區塊（僅用於 housing 議題）
function renderResearchOverviewSection(issueId) {
    // 只為 housing 議題顯示研究說明
    if (issueId !== 'housing') {
        return '';
    }
    
    // TODO: 請在此處插入「研究動機＋目的＋成果＋結論」的完整文本內容
    // 請使用清楚的 HTML 標籤（<h2>, <h3>, <p>, <ul>, <li>）進行排版
    return `
        <section id="research-overview" class="research-overview-section">
            <h2>研究說明</h2>
            <div class="research-overview-content">
                <!-- 請在此處插入研究動機、目的、成果、結論的完整文本內容 -->
                <p>研究說明內容將在此處顯示...</p>
            </div>
        </section>
    `;
}

// 渲染主要發現區塊
function renderFindingsSection() {
    return `
        <section class="findings-section">
            <h2>主要發現：居住正義議題的四個關鍵面向</h2>
            <div class="findings-content">
                <ul class="findings-list">
                    <li class="finding-item">
                        <h3>租金負擔持續上升，青年與低薪族群壓力最大</h3>
                        <p>觀察居住議題相關文本，可以看到「租金」「青年」「北部」「低薪」等關鍵字經常一起出現，顯示在都會區工作的年輕人與服務業、臨時工等族群，租金支出占所得比例偏高，超過一般建議的 30% 水準，形成長期的生活壓力與向上流動困難。</p>
                    </li>
                    <li class="finding-item">
                        <h3>租屋資訊不透明，導致糾紛與不信任</h3>
                        <p>與「黑心房東」「押金糾紛」「違建」「套房」相關的關鍵字，常與「合約」「仲介」「修繕」等一起出現，顯示許多糾紛來自資訊不對稱：租屋前不清楚房屋缺失與權利義務，租屋後發現問題卻缺乏清楚、快速的處理管道。</p>
                    </li>
                    <li class="finding-item">
                        <h3>弱勢與青年族群較難取得穩定、安全的居住選項</h3>
                        <p>許多文本將「弱勢」「單親」「學生」「移工」「新住民」與「租不到」「被拒租」「不友善條件」連結在一起，反映出特定身份的承租人更容易在市場上被排拒，同時與「社會住宅不足」「候補時間長」的討論串聯，顯示公共部門供給尚未完全填補市場缺口。</p>
                    </li>
                    <li class="finding-item">
                        <h3>法律與政策資訊分散，實際上難以使用</h3>
                        <p>雖然討論中不乏「租賃專法」「租金補貼」「社宅政策」等關鍵字，但常與「看不懂」「不知道怎麼申請」「不知道找誰」一起出現，顯示一般租屋族對法規與政府資源的認知有限，資訊雖存在，卻未被有效轉化為可以實際使用的工具。</p>
                    </li>
                </ul>
            </div>
        </section>
    `;
}

// 渲染問題診斷與解決方案區塊
function renderSolutionsSection() {
    return `
        <section class="solutions-section">
            <h2>問題診斷與解決方案</h2>
            <div class="solutions-content">
                <div class="solution-card">
                    <h3 class="solution-title">問題一：租金負擔過高，青年與低薪族難以安居</h3>
                    <div class="solution-card-content">
                        <div class="problem-section">
                            <h4>問題診斷：</h4>
                            <ul>
                                <li>都會區租金與所得成長脫節，青年與服務業、臨時工族群租金負擔比特別高。</li>
                                <li>輿論中充滿「被租金追著跑」「薪水都拿去繳房租」等敘事，反映結構性壓力。</li>
                            </ul>
                        </div>
                        <div class="solution-section">
                            <h4>解決方向：</h4>
                            <ul>
                                <li>建立常態更新的「租金資訊公開與監測機制」，讓民眾可以查詢各區域實際租金行情。</li>
                                <li>擴大並穩定化租金補貼與青年租屋支持政策，使補貼制度更可預期、申請流程更簡化。</li>
                                <li>鼓勵中長期租賃與穩定租期契約，降低租客頻繁搬遷與不確定感。</li>
                            </ul>
                        </div>
                        <div class="platform-role-section">
                            <h4>本平台可以扮演的角色：</h4>
                            <ul>
                                <li>透過文字探勘與視覺化，整理輿論與政策文件中對「高租金」的具體情境與受影響族群。</li>
                                <li>以議題地圖方式呈現「高租金」與「收入」「地區」「補貼政策」等概念的連結，協助使用者理解問題的結構，而不只是一句「房價太高」。</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div class="solution-card">
                    <h3 class="solution-title">問題二：租屋資訊不透明，黑心條款與糾紛頻傳</h3>
                    <div class="solution-card-content">
                        <div class="problem-section">
                            <h4>問題診斷：</h4>
                            <ul>
                                <li>常見關鍵字包含「不簽約」「口頭約定」「押金不退」「臨時漲租」「違建」等，反映租約內容不清楚與房屋狀況不透明。</li>
                                <li>許多案例顯示，租客在簽約前難以取得充分資訊，簽約後才發現屋況、權利義務與預期不符。</li>
                            </ul>
                        </div>
                        <div class="solution-section">
                            <h4>解決方向：</h4>
                            <ul>
                                <li>推動標準化租賃契約範本，要求重要條款（押金、修繕、漲租、終止條件）清楚寫明。</li>
                                <li>建立簡單易懂的「租約檢查清單」，讓租客在簽約前就能自我檢查風險。</li>
                                <li>強化對違規廣告、違建出租、押金濫收等行為的檢舉與處罰機制。</li>
                            </ul>
                        </div>
                        <div class="platform-role-section">
                            <h4>本平台可以扮演的角色：</h4>
                            <ul>
                                <li>蒐集與分析「租屋糾紛」相關文本，歸納出最常出現的風險關鍵字與情境。</li>
                                <li>提供「租約風險關鍵字提醒」與簡化說明，作為租客在看房與簽約前的參考工具。</li>
                                <li>未來可延伸為互動小工具：讓使用者貼上一段租屋文案，系統標出可能需要注意的字句。</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div class="solution-card">
                    <h3 class="solution-title">問題三：弱勢與特定身份族群被拒於租屋市場之外</h3>
                    <div class="solution-card-content">
                        <div class="problem-section">
                            <h4>問題診斷：</h4>
                            <ul>
                                <li>文本中可看到「不租學生」「不租外國人」「不租小孩」「不租寵物」等排除條件，顯示租屋市場存在明顯的歧視與排除。</li>
                                <li>與「社會住宅不足」「候補多年」「抽不到」等關鍵字相連，表示公共部門提供的替代選項尚無法完全承接被排拒者的需求。</li>
                            </ul>
                        </div>
                        <div class="solution-section">
                            <h4>解決方向：</h4>
                            <ul>
                                <li>擴大社會住宅與包租代管等公共與準公共方案，優先保障弱勢與被市場排拒族群。</li>
                                <li>設計對房東與包租業者的誘因機制（稅負、補助、風險分攤），降低承租弱勢戶的顧慮。</li>
                                <li>建立匿名通報與協助機制，讓遭遇歧視或不當拒租者有明確求助管道。</li>
                            </ul>
                        </div>
                        <div class="platform-role-section">
                            <h4>本平台可以扮演的角色：</h4>
                            <ul>
                                <li>透過社會網絡分析，呈現「拒租條件」在不同類型討論中的出現模式，讓使用者看到歧視不是個別事件，而是有結構性的。</li>
                                <li>彙整各種公共政策與 NGO 行動方案，讓一般使用者可以快速了解目前「替代方案」有哪些，以及缺口在哪裡。</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div class="solution-card">
                    <h3 class="solution-title">問題四：租客對法律與政策資源不熟悉，權利難以落實</h3>
                    <div class="solution-card-content">
                        <div class="problem-section">
                            <h4>問題診斷：</h4>
                            <ul>
                                <li>討論中常見「不知道有租賃專法」「不清楚怎麼申訴」「搞不懂補貼規則」等說法。</li>
                                <li>法規與政策資訊存在，但內容專業、分散在不同網站與文件中，一般民眾難以消化。</li>
                            </ul>
                        </div>
                        <div class="solution-section">
                            <h4>解決方向：</h4>
                            <ul>
                                <li>將租賃相關重要權益（押金退還、修繕責任、不得任意驅離等）整理成淺白的懶人包。</li>
                                <li>將補貼與社宅資訊重新整理成「我適用哪一種？」的情境式指引。</li>
                                <li>透過教育、工作坊與線上資源，使租屋族知道「遇到問題可以怎麼做」。</li>
                            </ul>
                        </div>
                        <div class="platform-role-section">
                            <h4>本平台可以扮演的角色：</h4>
                            <ul>
                                <li>利用文字探勘歸納出民眾最常問的問題，作為 Q&A 與教學內容的基礎。</li>
                                <li>在議題地圖中，把法律名詞與「實際案例」連在一起，讓使用者不是只看到條文，而是看到條文在真實生活中的作用。</li>
                                <li>作為其他官方資訊的入口網站，引導使用者連到各政府單位的正式說明與申請管道。</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `;
}

// 渲染議題詳情頁面
function renderIssuePage(data, issueId, articles = []) {
    const content = document.getElementById('issue-content');
    
    if (!data) {
        content.innerHTML = '<div class="error">無法載入議題資料</div>';
        return;
    }
    
    const html = `
        <div class="issue-header">
            <h2 class="issue-title">${data.title || '未命名議題'}</h2>
            <div class="issue-description">${data.description || '無描述'}</div>
        </div>
        
        ${renderResearchOverviewSection(issueId)}
        
        ${renderDataSourceSection(issueId, articles)}
        
        <section class="reading-guide">
            <p>
                在閱讀這個議題地圖時，請先了解不同利害關係人（如政府、青年、建商等）的立場與關注點。觀察關鍵字網絡時，可以注意哪些詞彙同時出現在多個立場中（代表共同關注），哪些詞彙只屬於特定立場（反映立場差異）。請記住，每個社會議題都有其複雜性，不要只從單一立場解讀，試著理解不同觀點背後的原因與考量。
            </p>
        </section>
        
        <div class="issue-layout">
            <div class="stances-column">
                <h3>不同立場</h3>
                ${renderStances(data.stances)}
            </div>
            
            <div class="network-column">
                <div class="network-header">
                    <h3>關鍵字網絡</h3>
                    ${renderLegend(data.nodes)}
                </div>
                <div class="view-toggle">
                    <button id="list-view-btn" class="view-btn active">列表模式</button>
                    <button id="network-view-btn" class="view-btn">網絡模式</button>
                </div>
                <div id="list-view" class="list-view">
                    ${renderKeywordList(data.nodes, data.stances)}
                </div>
                <div id="network-view" class="network-view" style="display: none;">
                    <div id="network" style="width: 100%; height: 400px; border: 1px solid #e0e0e0; border-radius: 6px; background-color: #fff;"></div>
                    <div id="keyword-hover-info" class="keyword-info" style="display: none;"></div>
                    <div id="node-info" class="node-info" style="display: none;"></div>
                </div>
                <section id="keyword-info" class="keyword-info-section">
                    <h3>關鍵詞說明</h3>
                    <p id="keyword-title">請在上方圖中點選一個關鍵詞節點。</p>
                    <p id="keyword-explanation"></p>
                    <ul id="keyword-examples"></ul>
                    <div id="related-articles" class="related-articles" style="display: none;"></div>
                </section>
            </div>
        </div>
        
        ${renderFindingsSection()}
        
        ${renderSolutionsSection()}
    `;
    
    content.innerHTML = html;
    
    // 儲存文章資料供後續使用
    window.articlesData = articles;
    
    // 初始化關鍵詞列表的點擊事件處理
    if (data.nodes) {
        initKeywordListClickHandlers(data.nodes, articles);
    }
    
    // 初始化視圖切換功能
    initViewToggle(data);
    
    // 建立網絡圖（延遲建立，只在網絡模式時才需要）
    if (data.nodes && data.links) {
        // 先不建立，等切換到網絡模式時再建立
        window.networkData = {
            nodes: data.nodes,
            links: data.links,
            stances: data.stances,
            articles: articles
        };
    }
}

// 初始化視圖切換功能
function initViewToggle(data) {
    const listViewBtn = document.getElementById('list-view-btn');
    const networkViewBtn = document.getElementById('network-view-btn');
    const listView = document.getElementById('list-view');
    const networkView = document.getElementById('network-view');
    
    if (!listViewBtn || !networkViewBtn || !listView || !networkView) {
        return;
    }
    
    // 列表模式按鈕點擊事件
    listViewBtn.addEventListener('click', function() {
        // 切換按鈕狀態
        listViewBtn.classList.add('active');
        networkViewBtn.classList.remove('active');
        
        // 切換視圖顯示
        listView.style.display = 'block';
        networkView.style.display = 'none';
    });
    
    // 網絡模式按鈕點擊事件
    networkViewBtn.addEventListener('click', function() {
        // 切換按鈕狀態
        networkViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        
        // 切換視圖顯示
        listView.style.display = 'none';
        networkView.style.display = 'block';
        
        // 如果網絡圖還沒建立，現在建立
        if (window.networkData && !window.networkCreated) {
            setTimeout(() => {
                createNetworkGraph(
                    window.networkData.nodes,
                    window.networkData.links,
                    window.networkData.stances,
                    window.networkData.articles || []
                );
                window.networkCreated = true;
            }, 100);
        }
    });
}

/**
 * 初始化議題詳情頁面
 * 
 * 此函數會在 issue.html 頁面載入時執行，負責：
 * 1. 從 URL 參數取得議題 ID
 * 2. 驗證議題 ID 是否有效
 * 3. 載入議題資料和文章資料
 * 4. 渲染完整議題頁面
 * 
 * 新增議題時，請在此函數的 validIssueIds 陣列中新增議題 ID
 * 
 * 資料載入流程：
 * 1. loadIssueData(issueId) → 載入 data/{issueId}.json
 * 2. loadArticlesData(issueId) → 載入 data/{issueId}_articles.json
 * 3. renderIssuePage() → 渲染頁面內容
 */
async function initIssuePage() {
    const issueId = getQueryParam('id');
    
    if (!issueId) {
        const content = document.getElementById('issue-content');
        content.innerHTML = `
            <div class="error">
                <p>缺少議題 ID 參數</p>
                <a href="index.html" class="back-link">← 返回首頁</a>
            </div>
        `;
        return;
    }
    
    /**
     * 有效的議題 ID 列表
     * 
     * 新增議題步驟：
     * 1. 在此陣列中新增議題 ID（例如：'climate'）
     * 2. 確保對應的資料檔案存在（data/climate.json, data/climate_articles.json）
     * 3. 在 renderDataSourceSection() 的 dataSourceInfo 中註冊
     * 4. 在 index.html 的議題列表中新增連結
     */
    const validIssueIds = ['housing', 'ai_ethics'];
    if (!validIssueIds.includes(issueId)) {
        const content = document.getElementById('issue-content');
        content.innerHTML = `
            <div class="error">
                <p>找不到此議題</p>
                <p>請確認您輸入的議題 ID 是否正確。</p>
                <a href="index.html" class="back-link">← 返回首頁</a>
            </div>
        `;
        return;
    }
    
    try {
        // 同時載入議題資料和文章資料（使用 Promise.all 提升載入效率）
        const [data, articlesData] = await Promise.all([
            loadIssueData(issueId),
            loadArticlesData(issueId)
        ]);
        
        const articles = articlesData.articles || [];
        renderIssuePage(data, issueId, articles);
    } catch (error) {
        const content = document.getElementById('issue-content');
        content.innerHTML = `
            <div class="error">
                <p>載入議題資料時發生錯誤: ${error.message}</p>
                <a href="index.html" class="back-link">← 返回首頁</a>
            </div>
        `;
    }
}

// 當頁面載入完成時初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // 檢查是否在議題詳情頁面
        if (document.getElementById('issue-content')) {
            initIssuePage();
        }
    });
} else {
    // 如果 DOM 已經載入完成
    if (document.getElementById('issue-content')) {
        initIssuePage();
    }
}

