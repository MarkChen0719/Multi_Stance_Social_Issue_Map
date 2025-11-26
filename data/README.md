# 資料檔案說明

本資料夾包含所有議題的資料檔案。每個議題需要以下檔案：

## 檔案結構

### 必要檔案

1. **`{issueId}.json`** - 主要議題資料
   - 包含議題基本資訊、立場、關鍵字節點、連結關係
   - 範例：`housing.json`、`ai_ethics.json`
   - 詳細格式請參考 `SCHEMA.md`

2. **`{issueId}_articles.json`** - 文章資料
   - 包含所有收錄的文章列表與關鍵字對應
   - 範例：`housing_articles.json`
   - 格式說明見下方

### 可選檔案

3. **`{issueId}_metadata.json`** - 元資料（可選）
   - 存放資料來源資訊、更新時間等後設資料
   - 範例：`housing_metadata.json`

4. **`{issueId}_network.json`** - 網絡圖資料（可選）
   - 可獨立存放節點與連結資料
   - 範例：`housing_network.json`
   - 如果 `{issueId}.json` 已包含 nodes 和 links，此檔案可省略

## 文章資料格式 (housing_articles.json)

```json
{
  "articles": [
    {
      "id": "article_001",
      "title": "文章標題",
      "source": "來源媒體名稱",
      "date": "2024-03-15",
      "url": "https://example.com/article/001",
      "keywords": ["關鍵字1", "關鍵字2"]
    }
  ]
}
```

### 欄位說明

- **id**: 文章唯一識別碼（建議格式：`article_XXX`）
- **title**: 文章標題，會顯示在文章列表中
- **source**: 來源媒體或平台名稱
- **date**: 發布日期，格式：`YYYY-MM-DD`
- **url**: 文章原始網址（請使用假網址或 `example.com`，避免使用真實新聞連結）
- **keywords**: 相關關鍵字陣列
  - ⚠️ **重要**：關鍵字必須與 `{issueId}.json` 中 `nodes` 的 `label` **完全匹配**
  - 例如：如果節點的 label 是「高房價」，文章中的 keywords 也必須是「高房價」

## 如何新增新議題

### 步驟 1：建立資料檔案

在 `data/` 資料夾中建立以下檔案：

1. `{issueId}.json` - 主要議題資料（參考 `housing.json` 格式）
2. `{issueId}_articles.json` - 文章資料（參考 `housing_articles.json` 格式）

### 步驟 2：在程式碼中註冊

#### 2.1 在 `assets/app.js` 中註冊議題 ID

找到 `initIssuePage()` 函數中的 `validIssueIds` 陣列，新增議題 ID：

```javascript
const validIssueIds = ['housing', 'ai_ethics', 'your_new_issue_id'];
```

#### 2.2 在 `assets/app.js` 中註冊資料來源資訊

找到 `renderDataSourceSection()` 函數中的 `dataSourceInfo` 物件，新增議題配置：

```javascript
const dataSourceInfo = {
  'housing': { ... },
  'ai_ethics': { ... },
  'your_new_issue_id': {
    sourceTypes: ['新聞報導', '評論文章'],
    platforms: ['某報', '某新聞網'],
    timeRange: '2023-2025',
    lastUpdated: '2025-01-24'
  }
};
```

#### 2.3 在 `index.html` 中新增議題連結

在議題列表區塊中新增議題卡片：

```html
<div class="issue-card">
  <a href="issue.html?id=your_new_issue_id">
    <h3>新議題名稱</h3>
    <p>議題描述</p>
  </a>
</div>
```

### 步驟 3：測試

1. 開啟首頁，確認新議題出現在議題列表中
2. 點擊新議題，確認能正常載入議題頁面
3. 檢查網絡圖、文章列表等功能是否正常運作

## 注意事項

1. **關鍵字匹配**：`{issueId}_articles.json` 中的 `keywords` 必須與 `{issueId}.json` 中 `nodes` 的 `label` 完全一致，才能正確顯示相關文章。

2. **URL 使用**：文章資料中的 `url` 請使用假網址（如 `https://example.com/...`），避免使用真實新聞連結。

3. **JSON 格式**：確保所有 JSON 檔案格式正確，可以使用線上 JSON 驗證工具檢查。

4. **ID 唯一性**：
   - 議題 ID 必須唯一
   - 每個立場的 ID 在該議題內必須唯一
   - 每個節點的 ID 在該議題內必須唯一

5. **連結有效性**：`links` 中的 `source` 和 `target` 必須對應到 `nodes` 中實際存在的節點 ID。

## 範例檔案

- `housing.json` - 居住正義議題（完整範例）
- `housing_articles.json` - 文章資料範例（含註解）
- `housing_metadata.json` - 元資料範例
- `housing_network.json` - 網絡圖資料範例（示範用）

## 相關文件

- `SCHEMA.md` - 詳細的資料格式說明文件
- `assets/app.js` - 前端程式碼（含詳細註解說明資料結構）


