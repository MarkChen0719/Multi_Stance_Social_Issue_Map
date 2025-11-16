// 網絡圖顯示的節點數量上限
const TOP_N_NODES = 10;

// 群組配置：統一的顏色和顯示名稱
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

// 取得 URL 查詢參數
function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// 載入議題資料
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

// 渲染立場卡片
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
function showKeywordDetails(node) {
    const keywordTitleDiv = document.getElementById('keyword-title');
    const keywordExplanationDiv = document.getElementById('keyword-explanation');
    const keywordExamplesDiv = document.getElementById('keyword-examples');
    
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
function initKeywordListClickHandlers(nodes) {
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
            initKeywordListClickHandlers(nodes);
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
                showKeywordDetails(node);
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
function createNetworkGraph(nodes, links, stances) {
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
                showKeywordDetails(node);
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

// 渲染議題詳情頁面
function renderIssuePage(data) {
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
                </section>
            </div>
        </div>
    `;
    
    content.innerHTML = html;
    
    // 初始化關鍵詞列表的點擊事件處理
    if (data.nodes) {
        initKeywordListClickHandlers(data.nodes);
    }
    
    // 初始化視圖切換功能
    initViewToggle(data);
    
    // 建立網絡圖（延遲建立，只在網絡模式時才需要）
    if (data.nodes && data.links) {
        // 先不建立，等切換到網絡模式時再建立
        window.networkData = {
            nodes: data.nodes,
            links: data.links,
            stances: data.stances
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
                    window.networkData.stances
                );
                window.networkCreated = true;
            }, 100);
        }
    });
}

// 初始化議題詳情頁面
async function initIssuePage() {
    const issueId = getQueryParam('id');
    
    if (!issueId) {
        const content = document.getElementById('issue-content');
        content.innerHTML = '<div class="error">缺少議題 ID 參數</div>';
        return;
    }
    
    try {
        const data = await loadIssueData(issueId);
        renderIssuePage(data);
    } catch (error) {
        const content = document.getElementById('issue-content');
        content.innerHTML = `<div class="error">載入議題資料時發生錯誤: ${error.message}</div>`;
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

