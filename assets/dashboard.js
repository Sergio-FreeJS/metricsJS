const version = '0.0.3';

let currentExecution = {executionTime:'', repoList:{}, pulls:{}, issues:{}, clones:{}, views:{}, forks:{}}
let cancelSignal = false;
let firstRenderExecuted  = false;

function renderCurrentExecution() {

    $( "#dataTabs" ).tabs('enable');

    initRepoListFilter(currentExecution.repoList);
    const footer = createRepoListFooterRow(repoConfig, currentExecution.repoList);
    creatTable(repoConfig.targetHTMLElement, currentExecution.executionTime, repoConfig, currentExecution.repoList, false, {sortable: true, types:{name:'alpha'}}, footer);
    
    buildMeasures(currentExecution);
    firstRenderExecuted = true;
}

function clearTables() {
    for(let i = 0; i < repoConfig.measures.length; i++) {
        document.getElementById(repoConfig.measures[i].targetHTMLElement).innerHTML = 'No data...'
        document.getElementById(repoConfig.measures[i].targetHTMLTab).style.display = 'none';
    }

}

async function loadDataFromGitHub() {
    clearTables();

    if(document.getElementById('personalTokenInput').value === ''){
        alert('You must specify a personal token');
        return;
    }

    if(document.getElementById('orgRepoInput').value === ''){
        alert('You must specify an organization or a repository');
        return;
    }

    let orgName = '';
    if('org' === $("input[name='radio-1']:checked").val()) {
        orgName = document.getElementById('orgRepoInput').value + '/';
    }

    const repoList        = await getRepoListInfo();
    const loadingRepoList = createLoadingRepoList(repoList);

    creatTable('loadingDiv', 'Loading repository data', {tableColumns:repoConfig.loadingTableColumns}, loadingRepoList);

    const pulls    = {};
    const issues   = {};
    const watchers = {};
    const clones   = {};
    const views    = {};
    const forks    = {};
    const projects = {};

    for (let i = 0; i < repoList.length; i++) {
        const repo = repoList[i];
        
        if (repoConfig.info.pulls) {
            try {
                pulls[repo.name]  = await loadData(`https://api.github.com/repos/${orgName}${repo.name}/pulls`);
                repo['my_pulls'] = pulls[repo.name].length;
                repo['my_opened_pulls'] = countOpenedIssues(pulls[repo.name]);
                repo['my_closed_pulls'] = repo['my_pulls'] - repo['my_opened_pulls'];
                loadingRepoList[i].pulls = 'OK';
            } catch {
                loadingRepoList[i].pulls = 'error';
                loadingRepoList[i]['app_css_class'] = 'row-error';
            }
            incrementProgressBar(repoList);
            if (cancelSignal) { 
                $( "#progressbar-container" )[0].style.display = 'none';
                return; 
            }
            creatTable('loadingDiv', 'Loading repository data', {tableColumns:repoConfig.loadingTableColumns}, loadingRepoList);
        } 

        if (repoConfig.info.forks) {
            try {
                forks[repo.name]  = await loadData(`https://api.github.com/repos/${orgName}${repo.name}/forks`);
                repo['my_forks'] = forks[repo.name].length;
                loadingRepoList[i].forks = 'OK';
            } catch {
                loadingRepoList[i].forks = 'error';
                loadingRepoList[i]['app_css_class'] = 'row-error';
            }
            incrementProgressBar(repoList);
            if (cancelSignal) { 
                $( "#progressbar-container" )[0].style.display = 'none';
                return; 
            }
            creatTable('loadingDiv', 'Loading repository data', {tableColumns:repoConfig.loadingTableColumns}, loadingRepoList);
        } 

        if (repoConfig.info.projects) {
            try {
                projects[repo.name]  = await loadData(`https://api.github.com/repos/${orgName}${repo.name}/projects`, {'Accept': 'application/vnd.github.inertia-preview+json'});
                repo['my_projects'] = projects[repo.name].length;
                loadingRepoList[i].projects = 'OK';
            } catch {
                loadingRepoList[i].projects = 'error';
                loadingRepoList[i]['app_css_class'] = 'row-error';
            }
            incrementProgressBar(repoList);
            if (cancelSignal) { 
                $( "#progressbar-container" )[0].style.display = 'none';
                return; 
            }
            creatTable('loadingDiv', 'Loading repository data', {tableColumns:repoConfig.loadingTableColumns}, loadingRepoList);
        } 

        if (repoConfig.info.issues) {
            try {
                const tmpIssues = await loadData(`https://api.github.com/repos/${orgName}${repo.name}/issues`);
                issues[repo.name] = removePullsFromIssues(tmpIssues);
                repo['my_issues'] = issues[repo.name].length;
                repo['my_opened_issues'] = countOpenedIssues(issues[repo.name]);
                repo['my_closed_issues'] = repo['my_issues'] - repo['my_opened_issues'];
                loadingRepoList[i].issues = 'OK';
                issues[repo.name] = await addProjectInformation(issues[repo.name], repo.full_name);
                repo['my_bugs'] = countBugsFromIssues(issues[repo.name]);
            } catch (error) {
                console.error(error);
                loadingRepoList[i].issues = 'error';
                loadingRepoList[i]['app_css_class'] = 'row-error';
            }
            incrementProgressBar(repoList);
            if (cancelSignal) { 
                $( "#progressbar-container" )[0].style.display = 'none';
                return; 
            }
            creatTable('loadingDiv', 'Loading repository data', {tableColumns:repoConfig.loadingTableColumns}, loadingRepoList);
        }

        if (repoConfig.info.watchers) {
            try {
                loadingRepoList[i].watchers = 'OK';
                watchers[repo.name] = await getWatchersInformation(repo.full_name);
                repo['my_watchers'] = watchers[repo.name]?.length ? watchers[repo.name].length : 0;
            } catch (error) {
                console.error(error);
                loadingRepoList[i].watchers = 'error';
                loadingRepoList[i]['app_css_class'] = 'row-error';
            }
            incrementProgressBar(repoList);
            if (cancelSignal) { 
                $( "#progressbar-container" )[0].style.display = 'none';
                return; 
            }
            creatTable('loadingDiv', 'Loading repository data', {tableColumns:repoConfig.loadingTableColumns}, loadingRepoList);
        }

        if (repoConfig.info.clones) {
            try {
                clones[repo.name] = await loadElement(`https://api.github.com/repos/${orgName}${repo.name}/traffic/clones`);
                repo['my_clones'] = clones[repo.name].count;
                repo['my_clones_uniques'] = clones[repo.name].uniques;
                loadingRepoList[i].clones = 'OK';
            } catch {
                loadingRepoList[i].clones = 'error';
                loadingRepoList[i]['app_css_class'] = 'row-error';
            }
            incrementProgressBar(repoList);
            if (cancelSignal) { 
                $( "#progressbar-container" )[0].style.display = 'none';
                return; 
            }
            creatTable('loadingDiv', 'Loading repository data', {tableColumns:repoConfig.loadingTableColumns}, loadingRepoList);
        }


        if (repoConfig.info.views) {
            try {
                views[repo.name] = await loadElement(`https://api.github.com/repos/${orgName}${repo.name}/traffic/views`);
                repo['my_views'] = views[repo.name].count;
                repo['my_views_uniques'] = views[repo.name].uniques;
                loadingRepoList[i].views = 'OK';
            } catch {
                loadingRepoList[i].views = 'error';
            }
            incrementProgressBar(repoList);
            if (cancelSignal) { 
                $( "#progressbar-container" )[0].style.display = 'none';
                return; 
            }
            creatTable('loadingDiv', 'Loading repository data', {tableColumns:repoConfig.loadingTableColumns}, loadingRepoList);
        }
    }

    $( "#progressbar-container" )[0].style.display = 'none';

    currentExecution.executionTime = `github_data_${new Date()}`;
    currentExecution.repoList = repoList;
    currentExecution.pulls = pulls;
    currentExecution.issues = issues;
    currentExecution.watchers = watchers;
    currentExecution.clones = clones;
    currentExecution.views  = views;
    currentExecution.forks  = forks;
    currentExecution.projects = projects;

    renderCurrentExecution();
}


async function addProjectInformation(issues, full_name) {
    let data = [];
    
        full_name = full_name.split('/');

    let projectInfoForIssues = [];
    let hasNextPage = true;
    let after = '';

    while(hasNextPage === true) {
        data = await callGraphQL(null, {query: `{
            repository(name: "${full_name[1]}", owner: "${full_name[0]}") {
                issues(first: 50${after}) {
                nodes {
                  projectCards(first: 100) {
                    nodes {
                      column {
                        name
                      }
                      project {
                        name
                      }
                    }
                    totalCount
                    pageInfo {
                      hasNextPage
                    }
                  }
                  id
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
                totalCount
              }
            }
          }`})

          hasNextPage = data?.data?.repository?.issues?.pageInfo?.hasNextPage;
          if(hasNextPage) {
            after = `, after:"${data?.data?.repository?.issues?.pageInfo?.endCursor}"`;
          }
          projectInfoForIssues = projectInfoForIssues.concat(data?.data?.repository?.issues?.nodes);
    }

    if(projectInfoForIssues){
    //   const issues = execution.issues[repoList[i].name] ? execution.issues[repoList[i].name] : [];

        for (let issueIndex = 0; issueIndex < issues.length; issueIndex++) {
            for (let x = 0; x < projectInfoForIssues.length; x++) {
                if(!issues[issueIndex]['projects']) {
                issues[issueIndex]['projects'] = '';
                }
                // let issueNodes = projectInfoForIssues[x].nodes;
                let issuesProject = {};
                for (let issueNodesIndex = 0; issueNodesIndex < projectInfoForIssues.length; issueNodesIndex++) {
                    let cardNodes = projectInfoForIssues[issueNodesIndex].projectCards.nodes;
                    for (let cardNodesIndex = 0; cardNodesIndex < cardNodes.length; cardNodesIndex++) {
                    //   console.log(issues[issueIndex].id, projectInfoForIssues[issueNodesIndex].id)
                        if(issues[issueIndex].node_id === projectInfoForIssues[issueNodesIndex].id && cardNodes[cardNodesIndex]?.project?.name){
                            // issues[issueIndex]['project'][cardNodes[cardNodesIndex]?.project?.name] = cardNodes[cardNodesIndex]?.column?.name;
                            issuesProject[cardNodes[cardNodesIndex]?.project?.name] = cardNodes[cardNodesIndex]?.column?.name;
                        }
                    }
                }
                issues[issueIndex]['projects'] = extractProjectPerIssue(issuesProject);
            }
        }
    }
    return issues;
}


async function getWatchersInformation(full_name) {
    full_name = full_name.split('/');
    let data = [];
    let watchers = [];
    let hasNextPage = true;
    let after = '';

    while(hasNextPage === true) {
        data = await callGraphQL(null, {query: `{
            repository(name: "${full_name[1]}", owner: "${full_name[0]}") {
                watchers(first: 50${after}) {
                    totalCount
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                    nodes {
                        email
                        id
                        login
                        name
                        company
                    }
                }
            }
        }`})

          hasNextPage = data?.data?.repository?.watchers?.pageInfo?.hasNextPage;
          if(hasNextPage) {
            after = `, after:"${data?.data?.repository?.watchers?.pageInfo?.endCursor}"`;
          }
          watchers = watchers.concat(data?.data?.repository?.watchers?.nodes);
    }

    return watchers;
}

function initRepoListFilter(repoList) {
    let repoNames = [];

    for (let i = 0; i < repoList.length; i++) {
        repoNames.push(repoList[i].name);
    }

    if(firstRenderExecuted) {
        $('input[name="repoListFilterInput"]').amsifySuggestags({}, 'refresh');
    }

    $( 'input[name="repoListFilterInput"]').amsifySuggestags({
        type : 'amsify',
        suggestions: repoNames,
        whiteList: true,
		afterAdd : function(value) {
            let filteredRepoList = filterRepoList(currentExecution.repoList, document.getElementById('repoListFilterInput').value);
            creatTable(repoConfig.targetHTMLElement, currentExecution.executionTime, repoConfig, filteredRepoList, true);
		},
		afterRemove : function(value) {
            if (document.getElementById('repoListFilterInput').value && document.getElementById('repoListFilterInput').value.length > 0) {
                let filteredRepoList = filterRepoList(currentExecution.repoList, document.getElementById('repoListFilterInput').value);
                creatTable(repoConfig.targetHTMLElement, currentExecution.executionTime, repoConfig, filteredRepoList, true);
            } else {
                creatTable(repoConfig.targetHTMLElement, currentExecution.executionTime, repoConfig, currentExecution.repoList, false, {sortable: true, types:{name:'alpha'}});
            }
            
		}
    });
}

function filterRepoList(repoList, filter) {
    if(filter && filter.length > 0) {
        let filterList = filter.split(',');
        return repoList.filter((elem) => filterList.indexOf(elem.name) > -1);
    }

    return repoList;
}

function incrementProgressBar(elements) {
    $( "#progressbar-container" )[0].style.display = 'block';
    let inc = (100/(elements.length*6)) + $( "#progressbar" ).progressbar("value");

    $( "#progressbar" ).progressbar({
        value: inc
    });
}

async function getRepoListInfo() {
    const orgRepoValue = document.getElementById('orgRepoInput').value;
    const orgRepoSelector = $("input[name='radio-1']:checked").val();

    if('repo' === orgRepoSelector) {
        return [{full_name: orgRepoValue, name: orgRepoValue}];
    }

    const topic = document.getElementById('searchInput').value;
     if (topic === '') {
         return await loadData(`https://api.github.com/orgs/${orgRepoValue}/repos`);
     }

     let result = [];
     const topics = topic.split(',');
     for (let i = 0; i < topics.length; i++) {
        let tmp = await searchData(`https://api.github.com/search/repositories?q=org:${orgRepoValue} ${topics[i]}`);
        result.push(...tmp);
     }
     return result;
}

async function searchData(url) {
    let tmp = await callAPI(`${url}&per_page=400`, {'Accept': 'application/vnd.github.mercy-preview+json'});
    return tmp.items;
}

async function loadData(url, optionalHeader) {
    const result = [];
    let page = 0;
    let callResult = [];

    do {
        page++;
        callResult = await callAPI(`${url}?page=${page}&per_page=90&state=all`, optionalHeader);
        result.push(...callResult);
    } while (callResult && callResult.length > 0);

    return result;
}

async function loadElement(url, optionalHeader) {
    return await callAPI(`${url}`, optionalHeader);
}

async function callGraphQL(optionalHeader, data) {
    return await callAPI(`https://api.github.com/graphql`, optionalHeader, "POST", data);
}

async function callAPI(url, optionalHeader, method, data) {
    method = method ? method : 'GET';
    const body = data ? JSON.stringify(data) : undefined;
    optionalHeader = optionalHeader ? optionalHeader : {};
    let headers = { 'Authorization': `Bearer ${document.getElementById('personalTokenInput').value}`, ...optionalHeader};

    const response = await fetch(url, { method, headers, body });
    if(response.status !== 200) {
        throw `Error loading data with status: ${status}`;
    }
    return(await response.json())
}

function isOddNumber(num) { return num % 2;}

function creatTable(targetElement, title, config, elements, alternateRow, sortInfo, footer) {
    const sortable = sortInfo && sortInfo.sortable ? true : false;
    const sortTypes = sortInfo && sortInfo.types ? sortInfo.types : {}; 
    let tableID = `${targetElement}Table`;
    let tableHTML = `<b>${title}</b><table border='1' id='${tableID}' class='${sortable ? 'sortable' : ''}'>`;

    tableHTML += "<thead><tr>";
    for (let item in config.tableColumns) {
        tableHTML += `<th class='${sortTypes[config.tableColumns[item].value] ? 'sorttable_' + sortTypes[config.tableColumns[item].value] : ''}'>${config.tableColumns[item].header}</th>`;
    }
    tableHTML += "</tr></thead><tbody>";

    let i = 0;
    for (let elem in elements) {
        i++;
        tableHTML += `<tr class="${alternateRow && isOddNumber(i) ? 'odd-table-row' : 'pair-table-row'} ${elements[elem]['app_css_class']}">`;
        for (let item in config.tableColumns) {
            let value = elements[elem][config.tableColumns[item].value]
            if (!value) {
                value = '';
            }
            tableHTML += `<td>${value}</td>`;
        }
        tableHTML += "</tr>";
    }
    tableHTML += "</tbody>"

    if(footer) {
        tableHTML += "<tfoot><tr>";
        for (let item in config.tableColumns) {
            tableHTML += `<td class='table-footer'>${footer[config.tableColumns[item].value] ? footer[config.tableColumns[item].value] : ''}</td>`;
        }
        tableHTML += "</tr></tfoot>";
    }
    tableHTML += "</table>"

    document.getElementById(targetElement).innerHTML = tableHTML;
    if (sortable) {
        sorttable.makeSortable(document.getElementById(tableID));
    }
}

function createChart(targetElement, title, config, elements) {
    let datasets = [];
    var colorNames = Object.keys(window.chartColors);
    let i = 0;
    let max = 5;
    for (let elem in elements) {
        i++;
        let data = []
        for (let x = 0; x < config.chartColumns.length; x++) {
            let value = elements[elem][config.chartColumns[x]];
            if (!value) { value = 0; }
            data.push(value);
        }

        max = Math.max(...data, max);

        datasets.push({label:  elements[elem].name,
            backgroundColor: Chart.helpers.color(colorNames[i]).alpha(0.5).rgbString(),
            borderColor: colorNames[i],
            borderWidth: 1,
            data
        });
    }
    var barChartData = {
        labels: config.chartColumns,
        datasets
    }

    document.getElementById(`${targetElement}CanvasContainer`).innerHTML = `<canvas id="${targetElement}Canvas"></canvas>`;
    var canvas = document.getElementById(`${targetElement}Canvas`);
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    return new Chart(ctx, {
        type: 'bar',
        data: barChartData,
        options: {
            plugins: {
                datalabels: {
                    align: 'end',
                    anchor: 'end',
                    display: function(context) {
                        return context.dataset.data[context.dataIndex] > 0;
                    },
                    font: {
                        weight: 'bold'
                    },
                    formatter: Math.round
                }
            },
            responsive: true,
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: config.title
            },
            tooltips: {
                mode: 'index'
            },
            hover: {
                mode: 'index'
            },
            scales: {
                yAxes: [{
                    ticks: {
                        // the data minimum used for determining the ticks is Math.min(dataMin, suggestedMin)
                        suggestedMin: 0,

                        // the data maximum used for determining the ticks is Math.max(dataMax, suggestedMax)
                        suggestedMax: max + 5
                    }
                }]
            }
        }
    });
}

function createLoadingRepoList(repoList) {
    let result = [];
    for (let i = 0; i < repoList.length; i++) {
        result.push({name:repoList[i].name});
    }
    return result;
}

function countBugsFromIssues(issues) {
    let result = 0;
    for (let i = 0; i < issues.length; i++) {
        for (let l = 0; l < issues[i].labels.length; l++) {
            if(issues[i].labels[l].name && 'internal bug tracker' === issues[i].labels[l].name.toLowerCase()) {
                result = result + 1;
            }
        }
    }
    return result;
}

function countOpenedIssues(issues) {
    let result = 0;
    for (let i = 0; i < issues.length; i++) {
        if(issues[i].state && issues[i].state === 'open') {
            result = result + 1;
        }
    }
    return result;
}

function removePullsFromIssues(issues) {
    let result = [];
    for (let i = 0; i < issues.length; i++) {
        if(!issues[i].pull_request) {
            result.push(issues[i]);
        }
    }
    return result;
}

function readTextFile(file, callback) {
    var head = document.getElementsByTagName('head')[0];

    //use class, as we can't reference by id
    var element = head.getElementsByClassName("json")[0];
  
    try {
      element.parentNode.removeChild(element);
    } catch (e) {
      // ignore exception
    }
  
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = file;
    script.className = "json";
    script.onload = callback;
    script.async = false;
    head.appendChild(script);
  
    //call the postload function after a slight delay to allow the json to load
    //window.setTimeout(callback, 100);
}

function initSaveFunctionality() {
    const urlParams = new URLSearchParams(window.location.search);
    const executionName = urlParams.get('execution');

    var input = document.getElementById("fileSelectorBtn");
    var loadFromGithub = document.getElementById("loadFromGithubBtn");
    var button = document.getElementById("saveBtn");
    var saveSettingsBtn = document.getElementById("saveSettingsBtn");
    var cancelLoadingBtn = document.getElementById("cancelLoadingBtn");

    input.onchange = function(e) {
      if(e.target.files.length === 0) {
        return;
      }

      var reader = new FileReader();
      reader.onload = function(event) {
        let res = event.target.result;
        if(res && res.startsWith("currentExecution = ")) {
            res = res.substring("currentExecution = ".length)
        }
        currentExecution = JSON.parse(res);
        renderCurrentExecution();
        document.getElementById('loadingDiv').innerHTML = 'Data loaded from local file<br>' + currentExecution.executionTime;
        // button.disabled = false;
      }
      reader.readAsText(new Blob([e.target.files[0]], {
        "type": "application/json"
      }));
    }

    loadFromGithub.onclick = function(e) {
        e.preventDefault();
        cancelSignal = false;
        $( "#dataTabs" ).tabs("option", "active", 0);
        $( "#dataTabs" ).tabs('disable');
        $( "#progressbar" ).progressbar({ value: 0 });
        loadDataFromGitHub();
    }

    saveSettingsBtn.onclick = function(e) {
        e.preventDefault();
        localStorage.setItem("personalToken", document.getElementById('personalTokenInput').value);
        localStorage.setItem("topics", document.getElementById('searchInput').value);
        localStorage.setItem("orgRepo", document.getElementById('orgRepoInput').value);
        localStorage.setItem("orgRepoRadio", $("input[name='radio-1']:checked").val());
    }

    cancelLoadingBtn.onclick = function(e) {
        e.preventDefault();
        cancelSignal = true;
        $( "#dataTabs" ).tabs("option", "active", 0);
        document.getElementById('loadingDiv').innerHTML = 'Loading cancelled by user';
        setTimeout(()=>{
            document.getElementById('loadingDiv').innerHTML = `Please click on 'Load Data from Github' to load information from github personal token is mandatory<br>or<br>Click on 'Choose file' to load saved data`;
        },3000);
    }

    button.onclick = function(e) {
      e.preventDefault();
      var blob = new Blob([`currentExecution = ${JSON.stringify(currentExecution)}`], {
        "type": "application/json"
      });
      var a = document.createElement("a");
      a.download = currentExecution.executionTime;
      a.href = URL.createObjectURL(blob);
      document.body.appendChild(a);
      a.click();
      input.value = "";
      // button.disabled = true;
      document.body.removeChild(a);
    }

    if(executionName) {
        $( "#tabs" )[0].style.display = 'none';
        readTextFile(`execution/${executionName}.json`, function(text){
            renderCurrentExecution();
            document.getElementById('loadingDiv').innerHTML = 'Data loaded from local file<br>' + currentExecution.executionTime;
        });
    }

}

function buildMeasures(execution) {
    for(let i = 0; i < repoConfig.measures.length; i++) {
        if (repoConfig.measures[i].enabled) {
            document.getElementById(repoConfig.measures[i].targetHTMLTab).style.display = 'block';
            window[repoConfig.measures[i].calculator](repoConfig.measures[i], execution);
        }
    }
}

function projectsCalculator(measureConfig, execution) {
    if(!execution.projects) {
        return;
    }
    const repoList = execution.repoList;
    let config = measureConfig.config;
    let result = [];
    for (let i = 0; i < repoList.length; i++) {
        result.push({name:repoList[i].name, app_css_class: 'table-group'});
        const projects = execution.projects[repoList[i].name] ? execution.projects[repoList[i].name] : [];
        for (let x = 0; x < projects.length; x++) {
            result.push({ project: projects[x].name, state: projects[x].state});
        }
    }
    creatTable(measureConfig.targetHTMLElement, measureConfig.title, measureConfig, result)
}

async function issuesCalculator(measureConfig, execution) {
    const repoList = execution.repoList;
    // let config = measureConfig.config;
    let result = [];

    for (let i = 0; i < repoList.length; i++) {
        result.push({name:repoList[i].name, app_css_class: 'table-group'});
        const issues = execution.issues[repoList[i].name] ? execution.issues[repoList[i].name] : [];
        for (let x = 0; x < issues.length; x++) {
            const record = { milestone: issues[x].milestone ? issues[x].milestone.title : '', title: issues[x].title, number: extractIssueID(issues[x]),
                             state: issues[x].state, labels: extractLabels(issues[x].labels), projects: issues[x].projects, body: issues[x].body};
            parseIssueBody(measureConfig, record);
            result.push(record);
        }
    }
    creatTable(measureConfig.targetHTMLElement, measureConfig.title, measureConfig, result)
}

function parseIssueBody(measureConfig, record) {
    const tokens = record?.body?.split(measureConfig.columnStart);
    tokens.forEach(element => {
        let column = element?.split(measureConfig.columnEnd);
        issuesCalculatorCheckColumn(measureConfig, record, column);
    });
}

function issuesCalculatorCheckColumn(measureConfig, record, column) {
    if (!column || column.length !== 2) {
        return;
    }

    if (measureConfig.config.cols.indexOf(column[0]) < 0) {
        measureConfig.config.cols.push(column[0]);
        measureConfig.tableColumns.push({header: column[0], value: column[0]})
    }
    record[column[0]] = column[1];
}


function extractProjectPerIssue(data) {
    const result = [];
    for (const prj in data) {
        result.push(`${prj} => ${data[prj]}`);
        
    }
    return result.join('; ');
}

function extractIssueID(issue) {
    return `<a href="${issue.html_url}" target="_blank">${issue.number}</a>`;
}

function extractLabels(labels) {
    const labelsName = [];
    labels = labels ? labels : [];
    for (let x = 0; x < labels.length; x++) {
        labelsName.push(labels[x].name);
    }
    return labelsName.length > 0 ? labelsName.join('; ') : '';
}

function historyCalculator(measureConfig, execution) {
    const repoList = execution.repoList;
    let config = measureConfig.config;
    let result = [];
    for (let i = 0; i < repoList.length; i++) {
        result.push({name:repoList[i].name, app_css_class: 'table-group'});
        result.push({name:'issues', ...computeHistoryData(config, execution.issues[repoList[i].name])});
        result.push({name:'forks', ...computeHistoryData(config, execution.forks[repoList[i].name])});
        result.push({name:'pulls', ...computeHistoryData(config, execution.pulls[repoList[i].name])});
    }
    creatTable(measureConfig.targetHTMLElement, measureConfig.title, measureConfig, result)
}

function computeHistoryData(config, data) {
    let result = {};
    if (!data) {
        data = [];
    }

    for (let x = 0; x < data.length; x++) {
        let dateElems = data[x]['created_at'].split('-');
        let key = `${dateElems[0]}-${dateElems[1]}`; 

        if (config.cols.indexOf(key) > 0) {
            result[key] = result[key] ? result[key] + 1 : 1;
        }
    }
    return result;
}

function topUserCalculator(measureConfig, execution) {
    let userList = {};
    for(let repo in execution.issues) {
        for(let i = 0; i < execution.issues[repo].length; i++) {
            let login = execution.issues[repo][i].user.login;
            userList[login] = userList[login] ? userList[login] : {issues: 0, pulls: 0, forks: 0, watches: 0, company:''};
            userList[login].issues = userList[login].issues + 1;
        }
    }

    for(let repo in execution.pulls) {
        for(let i = 0; i < execution.pulls[repo].length; i++) {
            let login = execution.pulls[repo][i].user.login;
            userList[login] = userList[login] ? userList[login] : {issues: 0, pulls: 0, forks: 0, watches: 0, company:''};
            userList[login].pulls = userList[login].pulls + 1;
        }
    }

    for(let repo in execution.forks) {
        for(let i = 0; i < execution.forks[repo].length; i++) {
            let login = execution.forks[repo][i].owner.login;
            userList[login] = userList[login] ? userList[login] : {issues: 0, pulls: 0, forks: 0, watches: 0, company:''};
            userList[login].forks = userList[login].forks + 1;
        }
    }

    for(let repo in execution.watchers) {
        for(let i = 0; i < execution.watchers[repo].length; i++) {
            let login = execution.watchers[repo][i].login;
            userList[login] = userList[login] ? userList[login] : {issues: 0, pulls: 0, forks: 0, watches: 0, company:''};
            userList[login].watches = userList[login].watches + 1;
            userList[login].company = execution.watchers[repo][i].company;
        }
    }

    let userArray = [];

    for( let user in userList) {
        userArray.push({name: user, ...userList[user]});
    }
    creatTable(measureConfig.targetHTMLElement, measureConfig.title, measureConfig, userArray, false, {sortable:true, types:{name:'alpha'}});
}

function newPerWeekCalculator(measureConfig, execution) {
    let weeks = [];
    measureConfig.chartColumns = [];
    const type = measureConfig.config.type;

    for( let repo in execution[type]) {
        const nodes = measureConfig.config.nodeName ? execution[type][repo][measureConfig.config.nodeName] : execution[type][repo];
        for(let i = 0; i < nodes.length; i++) {
            // const pull = measureConfig.config.nodeName ? execution[type][repo][i][nodeName] : execution[type][repo][i];
            const pull = nodes[i];
            const date = pull ? pull[measureConfig.config.dateField] : null;
            if(date) {
                let week = moment(date).week() - 1;
                let year = `H-${date.split('-')[0]}`;

                if(!weeks[year]) {
                    weeks[year] = {name: year};
                    // measureConfig.chartColumns.push(year);
                    for(let w = 0; w < 54; w++) {
                        weeks[year][w] = 0;
                    }
                }

                if (!weeks[year][week]) {
                    weeks[year][week] = 0;
                }
                weeks[year][week] = weeks[year][week] + 1;
            }
        }
    }

    for(let i = 0; i < 54; i++) {
        measureConfig.chartColumns[i] = i;
    }
    window.newPerWeekChart = createChart(measureConfig.targetHTMLElement, measureConfig.title, measureConfig, weeks);

}

function newPerMonthCalculator(measureConfig, execution) {
    let config = measureConfig.config;
    let tmp = { issues: {}, bugs: {}, pulls: {} };


    for (let r = 0; r < config.rows.length; r++) {
        let rowName = config.rows[r].name;
        tmp.issues[rowName] = newPerMonthComputeHistoryData(config, config.rows[r], execution.issues, (elem) => true);
        tmp.bugs[rowName]   = newPerMonthComputeHistoryData(config, config.rows[r], execution.issues, newPerMonthCalculatorBugFilter);
        tmp.pulls[rowName]  = newPerMonthComputeHistoryData(config, config.rows[r], execution.pulls, (elem) => true);
    }

    let result = []
    let dataForChart = [];
    
    let totalRow = {name:'New issues', app_css_class: 'table-group'};
    let rowResult = [];
    for( let row in tmp.issues) {
        for(let c in tmp.issues[row]) {
            totalRow[c] = totalRow[c] ? totalRow[c] + tmp.issues[row][c] : tmp.issues[row][c];
        }
        rowResult.push({name:row, ...tmp.issues[row]});
    }
    result.push(totalRow);
    dataForChart.push(totalRow);
    result = result.concat(rowResult);

    totalRow = {name:'New pull-requests', app_css_class: 'table-group'};
    rowResult = [];
    for( let row in tmp.pulls) {
        for(let c in tmp.pulls[row]) {
            totalRow[c] = totalRow[c] ? totalRow[c] + tmp.pulls[row][c] : tmp.pulls[row][c];
        }
        rowResult.push({name:row, ...tmp.pulls[row]});
    }
    result.push(totalRow);
    dataForChart.push(totalRow);
    result = result.concat(rowResult);

    totalRow = {name:'Created Bugzilla Tickets', app_css_class: 'table-group'};
    rowResult = [];
    for( let row in tmp.bugs) {
        for(let c in tmp.bugs[row]) {
            totalRow[c] = totalRow[c] ? totalRow[c] + tmp.bugs[row][c] : tmp.bugs[row][c];
        }
        rowResult.push({name:row, ...tmp.bugs[row]});
    }
    result.push(totalRow);
    dataForChart.push(totalRow);
    result = result.concat(rowResult);

    creatTable(measureConfig.targetHTMLElement, measureConfig.title, measureConfig, result);
    window.newPerMonthChart = createChart(measureConfig.targetHTMLElement, measureConfig.title, measureConfig, dataForChart);
}

function newPerMonthCalculatorBugFilter(elem) {
    for (let l = 0; l < elem.labels.length; l++) {
        if(elem.labels[l].name && 'internal bug tracker' === elem.labels[l].name.toLowerCase()) {
            return true;
        }
    }
    return false;
}

function newPerMonthComputeHistoryData(config, row, category, filterFnc) {
    let result = {};

    for (let i = 0; i < row.repos.length; i++) {
        let data = category[row.repos[i]] ? category[row.repos[i]] : [];
        for (let x = 0; x < data.length; x++) {
            if (filterFnc(data[x])) {
                let dateElems = data[x]['created_at'].split('-');
                let key = `${dateElems[0]}-${dateElems[1]}`; 
        
                if (config.cols.indexOf(key) > 0) {
                    result[key] = result[key] ? result[key] + 1 : 1;
                }
            }
        }
    }

    return result;
}


function totalSeries(measureConfig, execution) {
    const repoList = execution.repoList;
    let config = measureConfig.config;
    let tmp = { issues: {}, bugs: {}, pulls: {}, forks: {}, clones: {}, clones_uniques: {}, views: {}, views_uniques: {} };

    for (let i = 0; i < repoList.length; i++) {
        for (let r = 0; r < config.rows.length; r++) {
            tmp[`issues`][`${config.rows[r].name}`]          = tmp[`issues`][`${config.rows[r].name}`] ? tmp[`issues`][`${config.rows[r].name}`] : {};
            tmp[`pulls`][`${config.rows[r].name}`]           = tmp[`pulls`][`${config.rows[r].name}`]  ? tmp[`pulls`][`${config.rows[r].name}`] : {};
            tmp[`bugs`][`${config.rows[r].name}`]            = tmp[`bugs`][`${config.rows[r].name}`]   ? tmp[`bugs`][`${config.rows[r].name}`] : {};
            tmp[`forks`][`${config.rows[r].name}`]           = tmp[`forks`][`${config.rows[r].name}`]  ? tmp[`forks`][`${config.rows[r].name}`] : {};
            tmp[`clones`][`${config.rows[r].name}`]          = tmp[`clones`][`${config.rows[r].name}`] ? tmp[`clones`][`${config.rows[r].name}`] : {};
            tmp[`clones_uniques`][`${config.rows[r].name}`]  = tmp[`clones_uniques`][`${config.rows[r].name}`] ? tmp[`clones_uniques`][`${config.rows[r].name}`] : {};
            tmp[`views`][`${config.rows[r].name}`]           = tmp[`views`][`${config.rows[r].name}`]          ? tmp[`views`][`${config.rows[r].name}`] : {};
            tmp[`views_uniques`][`${config.rows[r].name}`]   = tmp[`views_uniques`][`${config.rows[r].name}`]  ? tmp[`views_uniques`][`${config.rows[r].name}`] : {};

            for (let x = 0; x < config.rows[r].cols.length; x++) {
                for (let c = 0; c < config.rows[r].cols[x].repos.length; c++) {
                    if (repoList[i].name === config.rows[r].cols[x].repos[c]) {
                        tmp[`issues`][`${config.rows[r].name}`][`${config.rows[r].cols[x].value}`] =
                            tmp[`issues`][`${config.rows[r].name}`][`${config.rows[r].cols[x].value}`] | 0 + repoList[i].my_issues | 0;

                        tmp[`pulls`][`${config.rows[r].name}`][`${config.rows[r].cols[x].value}`]  =
                            tmp[`pulls`][`${config.rows[r].name}`][`${config.rows[r].cols[x].value}`] | 0 + repoList[i].my_pulls | 0;

                        tmp[`bugs`][`${config.rows[r].name}`][`${config.rows[r].cols[x].value}`] =
                            tmp[`bugs`][`${config.rows[r].name}`][`${config.rows[r].cols[x].value}`] | 0 + repoList[i].my_bugs | 0;

                        tmp[`forks`][`${config.rows[r].name}`][`${config.rows[r].cols[x].value}`]  =
                            tmp[`forks`][`${config.rows[r].name}`][`${config.rows[r].cols[x].value}`] | 0 + repoList[i].forks | 0;

                        tmp[`clones`][`${config.rows[r].name}`][`${config.rows[r].cols[x].value}`]  =
                            tmp[`clones`][`${config.rows[r].name}`][`${config.rows[r].cols[x].value}`] | 0 + repoList[i].my_clones | 0;

                        tmp[`clones_uniques`][`${config.rows[r].name}`][`${config.rows[r].cols[x].value}`]  =
                            tmp[`clones_uniques`][`${config.rows[r].name}`][`${config.rows[r].cols[x].value}`] | 0 + repoList[i].my_clones_uniques | 0;

                           tmp[`views`][`${config.rows[r].name}`][`${config.rows[r].cols[x].value}`]  =
                            tmp[`views`][`${config.rows[r].name}`][`${config.rows[r].cols[x].value}`] | 0 + repoList[i].my_views | 0;

                        tmp[`views_uniques`][`${config.rows[r].name}`][`${config.rows[r].cols[x].value}`]  =
                            tmp[`views_uniques`][`${config.rows[r].name}`][`${config.rows[r].cols[x].value}`] | 0 + repoList[i].my_views_uniques | 0;


                    }
                }
            }
        }
    }

    let result = [];
    let dataForChart = [];
    for (let type in tmp) {
        // total count
        let row  = {name:`${type}_count`, app_css_class: 'table-group'};
        for (let grp in tmp[type]) {
            for (let elem in tmp[type][grp]) {
                row[elem] =  row[elem] ? row[elem] + tmp[type][grp][elem] : tmp[type][grp][elem];
            }
        }
        if (measureConfig.chartSeries.indexOf(type) > -1) {
            dataForChart.push(row);
        }
        result.push(row);

        // total count
        for (let grp in tmp[type]) {
            let rowGrp  = {name:`${grp}`};
            for (let elem in tmp[type][grp]) {
                rowGrp[elem] = tmp[type][grp][elem];
            }
            result.push(rowGrp);
        }
    }

    creatTable(measureConfig.targetHTMLElement, measureConfig.title, measureConfig, result);
    window.totalSeriesChart = createChart(measureConfig.targetHTMLElement, measureConfig.title, measureConfig, dataForChart);
}

function repoExplorerCalculator(measureConfig, execution) {
    let source = [];
    const repoList = execution.repoList;
    for (let i = 0; i < repoList.length; i++) {
        let children = [];

        let issues = reportExplorerExtractElements(execution.issues[repoList[i].name], 'title');
        if(issues.length > 0) {
            children.push( {title: 'issues', folder: true, children: issues});
        }

        let pulls = reportExplorerExtractElements(execution.pulls[repoList[i].name], 'title');
        if(pulls.length > 0) {
            children.push( {title: 'pulls', folder: true, children: pulls});
        }

        let watchers = [];
        if (execution.watchers) {
            watchers = reportExplorerExtractWatchers(execution.watchers[repoList[i].name], 'login');
        }
        if(watchers?.length > 0) {
            children.push( {title: 'watchers', folder: true, children: watchers});
        }

        source.push({title:`${repoList[i].name} [
                ${issues.length > 0 ? 'issues:' + issues.length + ';': ''}
                ${pulls.length > 0 ? 'pulls:' + pulls.length + '': ''}
                ${watchers.length > 0 ? 'watchers:' + watchers.length + '': ''}
            ]`, folder: children.length > 0,
            children
        });
    }


    if(firstRenderExecuted) {
        var tree = $.ui.fancytree.getTree(`#${measureConfig.targetHTMLElement}`);
        tree.reload(source);
        return;
    }

    $(`#${measureConfig.targetHTMLElement}`).fancytree({ 
        extensions: ["filter"],
        quicksearch: true,
        source,
        activate: function(e, data) {
          var node = data.node;
          if( node.data.href ){
            window.open(node.data.href, '_blank');
          }
        },
        filter: {
          autoApply: true,   // Re-apply last filter if lazy data is loaded
          autoExpand: true, // Expand all branches that contain matches while filtered
          counter: true,     // Show a badge with number of matching child nodes near parent icons
          fuzzy: false,      // Match single characters in order, e.g. 'fb' will match 'FooBar'
          hideExpandedCounter: true,  // Hide counter badge if parent is expanded
          hideExpanders: false,       // Hide expanders if all child nodes are hidden by filter
          highlight: true,   // Highlight matches by wrapping inside <mark> tags
          leavesOnly: false, // Match end nodes only
          nodata: true,      // Display a 'no data' status node if result is empty
          mode: "hide"       // Grayout unmatched nodes (pass "hide" to remove unmatched node instead)
        }});

        var tree = $.ui.fancytree.getTree(`#${measureConfig.targetHTMLElement}`);
    /*
     * Event handlers for our little demo interface
     */
    $("input[name=repoExplorerSearch]").on("keyup", function(e){
        var n,
          tree = $.ui.fancytree.getTree(),
          args = "autoApply autoExpand fuzzy hideExpanders highlight leavesOnly nodata".split(" "),
          opts = {},
          filterFunc = tree.filterBranches; // : tree.filterNodes,
          match = $(this).val();
  
        $.each(args, function(i, o) {
          opts[o] = $("#" + o).is(":checked");
        });
  
        if(e && e.which === $.ui.keyCode.ESCAPE || $.trim(match) === ""){
          $("button#repoExplorerSearchBtn").click();
          return;
        }

        
          // Pass a string to perform case insensitive matching
          n = filterFunc.call(tree, match, opts);

        $("button#repoExplorerSearchBtn").attr("disabled", false);
        $("span#repoExplorerSearchMatches").text("(" + n + " matches)");
      }).focus();
  
      $("button#repoExplorerSearchBtn").click(function(e){
        $("input[name=repoExplorerSearch]").val("");
        $("span#repoExplorerSearchMatches").text("");
        tree.clearFilter();
      }).attr("disabled", true);
}

function reportExplorerExtractElements(elements, field) {
    let result = [];
    elements = elements ? elements : [];
    for (let i = 0; i < elements.length; i++) {
        result.push({title:`[${elements[i].state}] [${elements[i].created_at}] ${elements[i][field]}`, href:elements[i].html_url});
    }
    return result;
}


function reportExplorerExtractWatchers(elements, field) {
    let result = [];
    elements = elements ? elements : [];
    for (let i = 0; i < elements.length; i++) {
        result.push({title:`${elements[i][field]} ${elements[i]['company']?'['+elements[i]['company']+']':''}`});
    }
    return result;
}

function createRepoListFooterRow(config, elements) {
    const excluded = ['id', 'name'];
    let result = {};

    for (let item in config.tableColumns) {
        if(excluded.indexOf(config.tableColumns[item].value) < 0) {
            result[config.tableColumns[item].value] = 0;
        }
    }

    for (let elem in elements) {
        for (let item in config.tableColumns) {
            let value = elements[elem][config.tableColumns[item].value];
            if(result[config.tableColumns[item].value] >= 0) {
                result[config.tableColumns[item].value] += value ? value : 0;
            }
        }
    }
    return result;
}

function exportTableToCSV(querySelector, filename) {
    var csv = [];
    var rows = document.querySelectorAll(querySelector);
    
    for (var i = 0; i < rows.length; i++) {
        var row = [], cols = rows[i].querySelectorAll("td, th");
        
        for (var j = 0; j < cols.length; j++) {
            let searchRegExp = new RegExp(',', 'g'); // Throws SyntaxError
            let text = cols[j].innerText ? cols[j].innerText : '';
            text = text.replace(searchRegExp, ' ');

            searchRegExp = new RegExp('"', 'g'); // Throws SyntaxError
            text = text.replace(searchRegExp, '\"');

            
            searchRegExp = new RegExp('\n', 'g'); // Throws SyntaxError
            text = text.replace(searchRegExp, ' ');

            if (text?.indexOf('=') === 0) {
                text =   + text; 
            }
            row.push(`"${text}"`);
        }

        csv.push(row.join(","));
    }

    // Download CSV file
    downloadCSV(csv.join("\n"), filename);
}

function downloadCSV(csv, filename) {
    var csvFile;
    var downloadLink;

    // CSV file
    csvFile = new Blob([csv], {type: "text/csv"});

    // Download link
    downloadLink = document.createElement("a");

    // File name
    downloadLink.download = filename;

    // Create a link to the file
    downloadLink.href = window.URL.createObjectURL(csvFile);

    // Hide download link
    downloadLink.style.display = "none";

    // Add the link to DOM
    document.body.appendChild(downloadLink);

    // Click download link
    downloadLink.click();
}