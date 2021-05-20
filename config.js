const repoConfig = {tableColumns:[
        {header:'ID',             value:'id'}, 
        {header:'Name',           value:'name'}, 
        {header:'Forks',          value:'my_forks'}, 
        // {header:'Open Issues',    value:'open_issues'}, 
        {header:'Open Issues',    value:'my_opened_issues'}, 
        {header:'Closed Issues',    value:'my_closed_issues'}, 
        {header:'Total Issues',         value:'my_issues'}, 
        {header:'Created Bugzilla Tickets',    value:'my_bugs'}, 
        {header:'Open Pulls',          value:'my_opened_pulls'}, 
        {header:'Closed Pulls',          value:'my_closed_pulls'}, 
        {header:'Total Pulls',          value:'my_pulls'}, 
        {header:'Clones',         value:'my_clones'}, 
        {header:'Clones Uniques', value:'my_clones_uniques'}, 
        {header:'Views',          value:'my_views'}, 
        {header:'Views Uniques',  value:'my_views_uniques'}, 
        {header:'Watchers',  value:'watchers'}],
    info: { pulls: true, issues: true, watchers:true, clones: true, views: true, forks: true, projects: true },
    targetHTMLElement: 'repoDiv',
    targetHTMLTab: 'repoListTab',
    enabled: true,
    title:'Repository List',
    loadingTableColumns:[  
        {header:'Name',           value:'name'},
        {header:'Forks',          value:'forks'},
        {header:'Issues',         value:'issues'},
        {header:'Watchers',       value:'watchers'},
        {header:'Pulls',          value:'pulls'},
        {header:'Clones',         value:'clones'},
        {header:'Views',          value:'views'},
        {header:'Projects',       value:'projects'}],
    measures:[
    { title: 'History',
        enabled: true,
        targetHTMLTab: 'repoHistoryTab',
        targetHTMLElement: 'historyDiv',
        calculator: 'historyCalculator',
        tableColumns:[  {header:'Name', value:'name'},
                        {header:'2019-01', value:'2019-01'},{header:'2019-02', value:'2019-02'},{header:'2019-03', value:'2019-03'},{header:'2019-04', value:'2019-04'},{header:'2019-05', value:'2019-05'},{header:'2019-06', value:'2019-06'},{header:'2019-07', value:'2019-07'},{header:'2019-08', value:'2019-08'},{header:'2019-09', value:'2019-09'},{header:'2019-10', value:'2019-10'},{header:'2019-11', value:'2019-11'},{header:'2019-12', value:'2019-12'},
                        {header:'2020-01', value:'2020-01'},{header:'2020-02', value:'2020-02'},{header:'2020-03', value:'2020-03'},{header:'2020-04', value:'2020-04'},{header:'2020-05', value:'2020-05'},{header:'2020-06', value:'2020-06'},{header:'2020-07', value:'2020-07'},{header:'2020-08', value:'2020-08'},{header:'2020-09', value:'2020-09'},{header:'2020-10', value:'2020-10'},{header:'2020-11', value:'2020-11'},{header:'2020-12', value:'2020-12'},
                        {header:'2021-01', value:'2021-01'},{header:'2021-02', value:'2021-02'},{header:'2021-03', value:'2021-03'},{header:'2021-04', value:'2021-04'},{header:'2021-05', value:'2021-05'},{header:'20201-06', value:'2021-06'},{header:'2021-07', value:'2021-07'},{header:'2021-08', value:'2021-08'},{header:'2021-09', value:'2021-09'},{header:'2021-10', value:'2021-10'},{header:'2021-11', value:'2021-11'},{header:'2021-12', value:'2021-12'}],
        config: {
            cols: ['2019-01','2019-02','2019-03','2019-04','2019-05','2019-06','2019-07','2019-08','2019-09','2019-10','2019-11','2019-12',
                    '2020-01','2020-02','2020-03','2020-04','2020-05','2020-06','2020-07','2020-08','2020-09','2020-10','2020-11','2020-12',
                    '2021-01','2021-02','2021-03','2021-04','2021-05','2021-06','2021-07','2021-08','2021-09','2021-10','2021-11','2021-12']
        }
    },
    { title: 'Issues',
        enabled: true,
        targetHTMLTab: 'issuesStatusTab',
        targetHTMLElement: 'issuesDiv',
        calculator: 'issuesCalculator',
        columnStart: '## **_',
        columnEnd: '_**',
        tableColumns:[ {header:'Name', value:'name'}, {header:'Milestone', value:'milestone'}, {header:'Projects', value:'projects'}, {header:'State', value:'state'}, {header:'Title', value:'title'}, {header:'#', value:'number'}, {header:'Labels', value:'labels'}, {header:'Content', value:'body'} ],
        config: {
            cols: ['milestone', 'projects','title','labels', 'state', 'body']
        }
    },
    { title: 'Projects',
        enabled: false,
        targetHTMLTab: 'projectsTab',
        targetHTMLElement: 'projectsDiv',
        calculator: 'projectsCalculator',
        tableColumns:[ {header:'Name', value:'name'}, {header:'Project', value:'project'}, {header:'State', value:'state'} ],
        config: {
            cols: ['project', 'state']
        }
    },
    { title: 'Top User',
        enabled: true,
        targetHTMLTab: 'topUserTab',
        targetHTMLElement: 'topUserDiv',
        calculator: 'topUserCalculator',
        tableColumns:[  {header:'Name', value:'name'},
                        {header:'Issues Count', value:'issues'},{header:'Pulls Count', value:'pulls'},{header:'Forks Count', value:'forks'},{header:'Watches Count', value:'watches'},{header:'Company', value:'company'}],
        config: {
            cols: ['name','issue', 'pulls', 'forks', 'watches', 'company']
        }
    },
    { title: 'RepoExplorer',
        enabled: true,
        targetHTMLTab: 'repoExplorerTab',
        targetHTMLElement: 'explorerDiv',
        calculator: 'repoExplorerCalculator'
    },
    { title: 'New PR per week',
        enabled: true,
        targetHTMLTab: 'newForWeekTab',
        targetHTMLElement: 'newPerWeekDiv',
        calculator: 'newPerWeekCalculator',
        config: {type:'pulls', dateField: 'created_at'}
    },
    { title: 'New Issues per week',
        enabled: true,
        targetHTMLTab: 'newIssuesForWeekTab',
        targetHTMLElement: 'newIssuesPerWeekDiv',
        calculator: 'newPerWeekCalculator',
        config: {type:'issues', dateField: 'created_at'}
    },
    { title: 'New Clones per week',
        enabled: true,
        targetHTMLTab: 'newClonesForWeekTab',
        targetHTMLElement: 'newClonesPerWeekDiv',
        calculator: 'newPerWeekCalculator',
        config: {type:'clones', nodeName: 'clones', dateField: 'timestamp' }
    },
    { title: 'New Forks per week',
        enabled: true,
        targetHTMLTab: 'newForksForWeekTab',
        targetHTMLElement: 'newForksPerWeekDiv',
        calculator: 'newPerWeekCalculator',
        config: {type:'forks', dateField: 'created_at'}
    }
]};

