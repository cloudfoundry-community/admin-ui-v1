
$(document).ready(function()
{
    Application.startup();
});

var Application =
{
    ID__CLOUD_CONTROLLERS:        "CloudControllers",
    ID__HEALTH_MANAGERS:          "HealthManagers",
    ID__GATEWAYS:                 "Gateways",
    ID__ROUTERS:                  "Routers",
    ID__DROPLET_EXECUTION_AGENTS: "DropletExecutionAgents",
    ID__APPLICATIONS:             "Applications",
    ID__USERS:                    "Users",
    ID__COMPONENTS:               "Components",
    ID__LOGS:                     "Logs",
    ID__TASKS:                    "Tasks",
    ID__STATS:                    "Stats",

    URL__CLOUD_CONTROLLERS:        "cloudControllers",
    URL__HEALTH_MANAGERS:          "healthManagers",
    URL__GATEWAYS:                 "gateways",
    URL__ROUTERS:                  "routers",
    URL__DROPLET_EXECUTION_AGENTS: "dropletExecutionAgents",
    URL__COMPONENTS:               "components",
    URL__LOGS:                     "logs",
    URL__LOG:                      "log",
    URL__TASKS:                    "tasks",
    URL__STATS:                    "statistics",

    STATUS__OFFLINE:  "OFFLINE",
    STATUS__RUNNING:  "RUNNING",
    STATUS__STARTED:  "STARTED",
    STATUS__STOPPED:  "STOPPED",
    STATUS__FINISHED: "FINISHED",

    taskID: 0,

    tableScrollPositions:    {},
    tableSelectedRowVisible: {},
    tablePageNumbers:        {},

    currentLog: null,

    refreshingTab: false,

    connected: true,


    startup: function()
    {
        var deferred = $.ajax({
                                  url: "settings",
                                  dataType: "json",
                                  type: "GET"
                              });

        deferred.done(function(response, status)
        {            
            Application.settings = response;

            Application.initialize();
        });

        deferred.fail(function(xhr, status, error)
        {
            window.location.href = "login.html";
        });        
    },

    initialize: function()
    {
        this.user = decodeURIComponent((new RegExp('[?|&]user=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;

        var this_ = this;

        $(window).resize(this.resize);

        if (this.settings.admin)
        {
            $("#Tasks").removeClass("hiddenPage");
            $("#DropletExecutionAgentsActions").removeClass("hiddenPage");
            $("#ComponentsActions").removeClass("hiddenPage");
            $("#StatsActions").removeClass("hiddenPage");
        }

        $(".user").text(this.user);

        $('[class*="user"]').mouseover(this.showUserMenu);
        $('[class*="user"]').mouseout(function() { $(".userMenu").hide(); });

        $(".userMenu").click(function() { this_.logout(); });

        $(".menuItem").mouseover(function() { $(this).toggleClass("menuItemHighlighted"); });
        $(".menuItem").mouseout(function()  { $(this).toggleClass("menuItemHighlighted"); });

        $(".menuItem").click(function() { this_.handleTabClicked($(this).attr("id")); });

        $('[class="menuItem"]').each(function(index, value)
        {
            if (this_["initialize" + this.id + "Page"])
            {
                this_["initialize" + this.id + "Page"]();
            }
        });

        $("#RefreshButton").click(this.refreshButton);

        $("#DialogCancelButton").click(this.hideDialog);

        this.showLoadingPage();

        this.initializeCache();

        this.handleTabClicked(this.ID__DROPLET_EXECUTION_AGENTS);
    },

    initializeCache: function()
    {
        this.cache = new Array();

        this.cache[this.URL__CLOUD_CONTROLLERS]        = {};
        this.cache[this.URL__HEALTH_MANAGERS]          = {};
        this.cache[this.URL__GATEWAYS]                 = {};
        this.cache[this.URL__ROUTERS]                  = {};
        this.cache[this.URL__DROPLET_EXECUTION_AGENTS] = {};
        this.cache[this.URL__COMPONENTS]               = {};
        this.cache[this.URL__LOGS]                     = {};
        this.cache[this.URL__TASKS]                    = {};
        this.cache[this.URL__STATS]                    = {};

        this.refreshData();
    },

    refreshData: function()
    {
        this.cache[this.ID__CLOUD_CONTROLLERS]        = true;
        this.cache[this.ID__HEALTH_MANAGERS]          = true;
        this.cache[this.ID__GATEWAYS]                 = true;
        this.cache[this.ID__ROUTERS]                  = true;
        this.cache[this.ID__DROPLET_EXECUTION_AGENTS] = true;
        this.cache[this.ID__APPLICATIONS]             = true;
        this.cache[this.ID__USERS]                    = true;
        this.cache[this.ID__COMPONENTS]               = true;
        this.cache[this.ID__LOGS]                     = true;
        this.cache[this.ID__TASKS]                    = true;
        this.cache[this.ID__STATS]                    = true;

        this.getData(this.URL__CLOUD_CONTROLLERS,        true);
        this.getData(this.URL__HEALTH_MANAGERS,          true);
        this.getData(this.URL__GATEWAYS,                 true);
        this.getData(this.URL__ROUTERS,                  true);
        this.getData(this.URL__DROPLET_EXECUTION_AGENTS, true);
        this.getData(this.URL__COMPONENTS,               true);
        this.getData(this.URL__LOGS,                     true);
        this.getData(this.URL__TASKS,                    true);
        this.getData(this.URL__STATS,                    true);
    },

    initializeCloudControllersPage: function()
    {
        this.cloudControllersTable = this.createTable(this.ID__CLOUD_CONTROLLERS, this.cloudControllerClicked, []);
    },

    initializeHealthManagersPage: function()
    {
        this.healthManagersTable = this.createTable(this.ID__HEALTH_MANAGERS, this.healthManagerClicked, []);
    },

    initializeGatewaysPage: function()
    {
        this.gatewaysTable     = this.createTable(this.ID__GATEWAYS, this.gatewayClicked, [[7, "asc"]]);
        this.gatewayNodesTable = this.createTable("GatewayNodes",    null,                [[1, "asc"]]);
    },

    initializeRoutersPage: function()
    {
        this.routersTable = this.createTable(this.ID__ROUTERS, this.routerClicked, []);
    },

    initializeDropletExecutionAgentsPage: function()
    {
        $("#DropletExecutionAgentsCreateButton").click(this.handleCreateNewDEA);        

        this.dropletExecutionAgentsTable = this.createTable(this.ID__DROPLET_EXECUTION_AGENTS, this.dropletExecutionAgentClicked, [[9, "desc"]]);
    },

    initializeApplicationsPage: function()
    {
        this.applicationsTable = this.createTable(this.ID__APPLICATIONS, this.applicationClicked, []);
    },

    initializeUsersPage: function()
    {
        this.usersTable = this.createTable(this.ID__USERS, this.userClicked, [[1, "desc"]]);
    },

    initializeComponentsPage: function()
    {
        $("#ComponentsRemoveAllButton").click(this.handleRemoveAllItems);        

        this.componentsTable = this.createTable(this.ID__COMPONENTS, this.componentClicked, [[1, "asc"]]);
    },

    initializeLogsPage: function()
    {
        $("#LogFirstButton").click(this.handleLogFirstClicked);
        $("#LogBackButton").click(this.handleLogBackClicked);
        $("#LogForwardButton").click(this.handleLogForwardClicked);
        $("#LogLastButton").click(this.handleLogLastClicked);

        $("#LogScrollBar").mousedown(this.startLogScrollbar);

        $("#LogContents").scroll(this.handleLogScrolled);

        this.logsTable = this.createTable(this.ID__LOGS, this.logClicked, [[2, "desc"]]);

        $("#LogsTable_length").change(this.resizeLogsPage);
    },

    initializeTasksPage: function()
    {
        $("#TaskShowTimestamps").click(this.handleTaskCheckboxClicked);
        $("#TaskShowStandardOut").click(this.handleTaskCheckboxClicked);
        $("#TaskShowStandardError").click(this.handleTaskCheckboxClicked);

        this.tasksTable = this.createTable(this.ID__TASKS, this.taskClicked, [[2, "desc"]]);

        $("#TasksTable_length").change(this.resizeTasksPage);
    },

    initializeStatsPage: function()
    {
        $("#StatsCreateButton").click(this.handleCreateNewStats);

        this.statsTable = this.createTable(this.ID__STATS, null, [[0, "desc"]]);
    },


    showUserMenu: function()
    {
        var position = $(".userContainer").position();

        var height = $(".userContainer").outerHeight();
        var width  = $(".userContainer").outerWidth();

        var menuWidth = $(".userMenu").outerWidth();

        $(".userMenu").css({
                               position: "absolute",
                               top: (position.top + height + 2) + "px",
                               left: (position.left + width - menuWidth) + "px"
                           }).show();
    },

    logout: function()
    {
        var deferred = $.ajax({
                                  url: "login",
                                  dataType: "json",
                                  type: "POST"
                              });

        deferred.always(function(xhr, status, error)
        {
            window.location.href = "login.html";
        });
    },

    handleTabClicked: function(pageID)
    {
        this.saveSelectedTableRowVisible();

        this.setTabSelected(pageID);

        // Refresh the page for the tab.
        this["refresh" + pageID + "Page"](false);
    },

    // This function sets the tab selected but does not show the tab contents.
    setTabSelected: function(pageID)
    {
        // Hide all of the pages.
        $("*[id*=Page]").each(function()
        {
            $(this).addClass("hiddenPage");
        });

        // Select the tab.
        $(".menuItem").removeClass("menuItemSelected");
        $("#" + pageID).addClass("menuItemSelected");
    },

    showWaitCursor: function()
    {   
        $("html").addClass("waiting");
    },

    restoreCursor: function()
    {
        $("html").removeClass("waiting");

        // The cursor does not change on the Application's page.  
        // Interestingly, just calling this fixes the issue.
        $("#RefreshButton").css("left");
    },

    showLoadingPage: function()
    {
        $(".errorPage").hide();
        $(".loadingPage").show();
    },

    showErrorPage: function(error)
    {
        $(".loadingPage").hide();

        $(".errorText").text(error);
        $(".errorPage").show();
    },

    showPage: function(pageID, fixup)
    {
        // Make sure the user didn't switch tabs while page was refreshing...
        if ($("#" + pageID).hasClass("menuItemSelected"))
        {
            $(".errorPage").hide();
            $(".loadingPage").hide();

            /*
            if (fixup != null)
            {
                $("#" + pageID + "Page").css("visibility", "hidden");
            }
            */

            $("#" + pageID + "Page").removeClass("hiddenPage");


            if (fixup != null)
            {
                // The fixup triggers a saveTableScrollPosition() which corrupts the scroll position...
                Application.ignoreScroll = true;

                // This code is necessary because when DataTables are shown
                // their scroll headers are not sized correctly until after
                // a redraw.
                fixup();
            }

            Application.restoreTableScrollPosition(pageID);
            Application.ignoreScroll = false;

            Application.restoreCursor();

            /*
            if (fixup != null)
            {
                $("#" + pageID + "Page").css("visibility", "visible");
            }
            */
        }
    },

    resize: function()
    {
        if ($("#Logs").hasClass("menuItemSelected"))
        {
            Application.resizeLogsPage();
        }
        else if ($("#Tasks").hasClass("menuItemSelected"))
        {
            Application.resizeTasksPage();
        } 
        else if ($("#Stats").hasClass("menuItemSelected"))
        {
            Application.resizeStatsPage();
        }
    },

    getCurrentPageID: function()
    {
        return $($.find(".menuItemSelected")).attr("id");
    },

    refreshButton: function()
    {
        Application.saveSelectedTableRowVisible();

        Application.showWaitCursor();

        Application.refreshData();

        var pageID = Application.getCurrentPageID();

        //$("#" + pageID + "Page").addClass("hiddenPage");

        Application["refresh" + pageID + "Page"](false);
    },

    refreshCloudControllersPage: function(reload)
    {
        this.getData(this.URL__CLOUD_CONTROLLERS, reload).done(function(result)
        {
            Application.refreshTab(Application.ID__CLOUD_CONTROLLERS, [result], reload);
        });
    },

    getCloudControllersTableData: function(results)
    {
        return this.getTableData(results, this.ID__CLOUD_CONTROLLERS);
    },

    getCloudControllersRow: function(row, cloudController)
    {
        row.push(cloudController.name);

        if (cloudController.connected)
        {
            row.push(this.STATUS__RUNNING);
            row.push(cloudController.data.num_cores);
            row.push(cloudController.data.cpu);
            row.push(cloudController.data.mem);

            row.push(cloudController);
        }
        else
        {
            row.push(this.STATUS__OFFLINE);

            this.addEmptyElementsToArray(row, 4);

            row.push(cloudController.uri);
        }
    },

    cloudControllerClicked: function()
    {
        Application.itemClicked("CloudController", 5, false);
    },

    handleCloudControllerClicked: function(table, cloudController, row)
    {
        Application.addPropertyRow(table, "Name",                cloudController.name, true);
        Application.addLinkRow(table,     "URI",                 Application.formatString(cloudController.uri));
        Application.addPropertyRow(table, "Started",             Utilities.formatDateString(cloudController.data.start), true);
        Application.addPropertyRow(table, "Uptime",              Application.formatUptime(cloudController.data.uptime));
        Application.addPropertyRow(table, "Cores",               Utilities.formatNumber(cloudController.data.num_cores));
        Application.addPropertyRow(table, "CPU",                 Utilities.formatNumber(cloudController.data.cpu));
        Application.addPropertyRow(table, "Memory",              Utilities.formatNumber(cloudController.data.mem));
        // V1
        if ((cloudController.data.requests != null) && (cloudController.data.pending_requests != null) && (cloudController.data.requests_per_sec != null))
        {
            Application.addPropertyRow(table, "Requests",            Utilities.formatNumber(cloudController.data.requests));
            Application.addPropertyRow(table, "Pending Requests",    Utilities.formatNumber(cloudController.data.pending_requests));
            Application.addPropertyRow(table, "Requests Per Second", Utilities.formatNumber(cloudController.data.requests_per_sec));
        }
        // NG
        else if ((cloudController.data.vcap_sinatra.requests.completed != null) && (cloudController.data.vcap_sinatra.requests.outstanding != null))
        {
            Application.addPropertyRow(table, "Requests",         Utilities.formatNumber(cloudController.data.vcap_sinatra.requests.completed));
            Application.addPropertyRow(table, "Pending Requests", Utilities.formatNumber(cloudController.data.vcap_sinatra.requests.outstanding));
        }
    },

    refreshHealthManagersPage: function(reload)
    {
        this.getData(this.URL__HEALTH_MANAGERS, reload).done(function(result)
        {
            Application.refreshTab(Application.ID__HEALTH_MANAGERS, [result], reload);
        });
    },

    getHealthManagersTableData: function(results)
    {
        return this.getTableData(results, this.ID__HEALTH_MANAGERS);
    },

    getHealthManagersRow: function(row, healthManager)
    {
        row.push(healthManager.name);

        if (healthManager.connected)
        {
            row.push(this.STATUS__RUNNING);
            row.push(healthManager.data.num_cores);
            row.push(healthManager.data.cpu);
            row.push(healthManager.data.mem);
            row.push(healthManager.data.total_users);
            row.push(healthManager.data.total_apps);
            row.push(healthManager.data.total_instances);

            row.push(healthManager);
        }
        else
        {
            row.push(this.STATUS__OFFLINE);

            this.addEmptyElementsToArray(row, 7);

            row.push(healthManager.uri);
        }
    },

    healthManagerClicked: function()
    {
        Application.itemClicked("HealthManager", 8, false);
    },

    handleHealthManagerClicked: function(table, healthManager, row)
    {
        Application.addPropertyRow(table, "Name",              healthManager.name, true);
        Application.addLinkRow(table,     "URI",               Application.formatString(healthManager.uri));
        Application.addPropertyRow(table, "Started",           Utilities.formatDateString(healthManager.data.start), true);
        Application.addPropertyRow(table, "Uptime",            Application.formatUptime(healthManager.data.uptime));
        Application.addPropertyRow(table, "Cores",             Utilities.formatNumber(healthManager.data.num_cores));
        Application.addPropertyRow(table, "CPU",               Utilities.formatNumber(healthManager.data.cpu));
        Application.addPropertyRow(table, "Memory",            Utilities.formatNumber(healthManager.data.mem));
        Application.addPropertyRow(table, "Users",             Utilities.formatNumber(healthManager.data.total_users));
        Application.addPropertyRow(table, "Applications",      Utilities.formatNumber(healthManager.data.total_apps));
        Application.addPropertyRow(table, "Instances",         Utilities.formatNumber(healthManager.data.total_instances));
        Application.addPropertyRow(table, "Running Instances", Utilities.formatNumber(healthManager.data.running_instances));
        Application.addPropertyRow(table, "Crashed Instances", Utilities.formatNumber(healthManager.data.crashed_instances));
        // V1
        if (healthManager.data.down_instances != null)
        {
            Application.addPropertyRow(table, "Down Instances", Utilities.formatNumber(healthManager.data.down_instances));
        }
    },

    refreshGatewaysPage: function(reload)
    {
        this.getData(this.URL__GATEWAYS, reload).done(function(result)
        {
            Application.refreshTab(Application.ID__GATEWAYS, [result], reload);

            Application.gatewayNodesTable.fnDraw();
        });
    },

    getGatewaysTableData: function(results)
    {
        return this.getTableData(results, this.ID__GATEWAYS);
    },

    getGatewaysRow: function(row, gateway)
    {
        row.push(gateway.name);

        if (gateway.connected)
        {
            // For some reason nodes is not an array.
            var numNodes = 0;
            if (gateway.data.nodes != null)
            {
                numNodes = Object.keys(gateway.data.nodes).length;
            }

            row.push(this.STATUS__RUNNING);
            row.push(gateway.data.config.service.description);
            row.push(gateway.data.cpu);
            row.push(gateway.data.mem);
            row.push(numNodes);
            var provisionedServices = this.getGatewayProvisionedServices(gateway);
            var availableCapacity   = this.getGatewayAvailableCapacity(gateway);
            row.push(provisionedServices);
            row.push(availableCapacity);
            var percentAvailableCapacity = Math.round((availableCapacity / (provisionedServices + availableCapacity)) * 100);
            row.push(percentAvailableCapacity);

            row.push(gateway);
        }
        else
        {
            row.push(this.STATUS__OFFLINE);

            this.addEmptyElementsToArray(row, 8);

            row.push(gateway.uri);
        }
    },

    getGatewayAvailableCapacity: function(gateway)
    {
        var capacity = 0;

        for (var index in gateway.data.nodes)
        {
            var node = gateway.data.nodes[index];

            if (node.available_capacity != null)
            {
                capacity += node.available_capacity;
            }
        }

        return capacity;
    },

    getGatewayProvisionedServices: function(gateway)
    {
        var numServices = 0;

        for (var index in gateway.data.prov_svcs)
        {
            if (gateway.data.prov_svcs[index].configuration.data == null)
            {
                numServices++;
            }
        }

        return numServices;
    },

    gatewayClicked: function()
    {
        var tableTools = TableTools.fnGetInstance("GatewaysTable");

        var selected = tableTools.fnGetSelectedData();


        Application.hideDetails("Gateway");

        $("#GatewayNodesTableContainer").hide();

        if ((selected.length > 0) && (selected[0][1] == Application.STATUS__RUNNING))
        {
            $("#GatewayDetailsLabel").show();

            $("#GatewayNodesTableContainer").show();


            var containerDiv = $("#GatewayPropertiesContainer").get(0);

            var table = Application.createPropertyTable(containerDiv);

            var gateway = selected[0][9];

            
            Application.addPropertyRow(table, "Name",                 gateway.name, true);
            Application.addLinkRow(table,     "URI",                  Application.formatString(gateway.uri));
            Application.addPropertyRow(table, "Supported Versions",   Application.formatString(Application.getGatewaySupportedVersions(gateway)));
            Application.addPropertyRow(table, "Description",          Application.formatString(gateway.data.config.service.description));
            Application.addPropertyRow(table, "Started",              Utilities.formatDateString(gateway.data.start));
            Application.addPropertyRow(table, "Uptime",               Application.formatUptime(gateway.data.uptime));
            Application.addPropertyRow(table, "Cores",                Utilities.formatNumber(gateway.data.num_cores));
            Application.addPropertyRow(table, "CPU",                  Utilities.formatNumber(gateway.data.cpu));
            Application.addPropertyRow(table, "Memory",               Utilities.formatNumber(gateway.data.mem));
            Application.addPropertyRow(table, "Provisioned Services", Utilities.formatNumber(selected[0][6]));
            Application.addPropertyRow(table, "Available Capacity",   Utilities.formatNumber(selected[0][7]) + " (" + selected[0][8] + "%)");


            var tableData = new Array();

            for (var index in gateway.data.nodes)
            {
                var node = gateway.data.nodes[index];

                var row = new Array();

                row.push(node.id);
                row.push(node.available_capacity);

                tableData.push(row);
            }

            Application.gatewayNodesTable.fnClearTable();
            Application.gatewayNodesTable.fnAddData(tableData);
        }
    },

    getGatewaySupportedVersions: function(gateway)
    {
        var result = "";

        if (gateway != null)
        {
            var versions = gateway.data.config.service.supported_versions;

            if (versions != null)
            {
                var versionAliases = gateway.data.config.service.version_aliases;

                if ((versionAliases != null) && (versionAliases.deprecated != null))
                {
                    var index = versions.indexOf(versionAliases.deprecated);

                    if (index >= 0)
                    {               
                        versions.splice(index, 1);
                    }
                }
                
                result = versions.toString();

                result = result.replace(",", ", ");
            }
        }

        return result;   
    },

    refreshRoutersPage: function(reload)
    {
        this.getData(this.URL__ROUTERS, reload).done(function(result)
        {
            Application.refreshTab(Application.ID__ROUTERS, [result], reload);
        });
    },

    getRoutersTableData: function(results)
    {
        return this.getTableData(results, this.ID__ROUTERS);
    },

    getRoutersRow: function(row, router)
    {
        row.push(router.name);

        if (router.connected)
        {
            row.push(this.STATUS__RUNNING);
            row.push(router.data.num_cores);
            row.push(router.data.cpu);
            row.push(router.data.mem);
            row.push(router.data.droplets);
            row.push(router.data.requests);
            row.push(router.data.bad_requests);

            row.push(router);
        }
        else
        {
            row.push(this.STATUS__OFFLINE);

            this.addEmptyElementsToArray(row, 7);

            row.push(router.uri);
        }
    },

    routerClicked: function()
    {
        Application.itemClicked("Router", 8, false);
    },

    handleRouterClicked: function(table, router, row)
    {
        Application.addPropertyRow(table, "Name",          router.name, true);
        Application.addLinkRow(table,     "URI",           Application.formatString(router.uri));
        Application.addPropertyRow(table, "Started",       Utilities.formatDateString(router.data.start));
        Application.addPropertyRow(table, "Uptime",        Application.formatUptime(router.data.uptime));
        Application.addPropertyRow(table, "Cores",         Utilities.formatNumber(router.data.num_cores));
        Application.addPropertyRow(table, "CPU",           Utilities.formatNumber(router.data.cpu));
        Application.addPropertyRow(table, "Memory",        Utilities.formatNumber(router.data.mem));
        Application.addPropertyRow(table, "Droplets",      Utilities.formatNumber(router.data.droplets));
        Application.addPropertyRow(table, "Requests",      Utilities.formatNumber(router.data.requests));
        Application.addPropertyRow(table, "Bad Requests",  Utilities.formatNumber(router.data.bad_requests));
        Application.addPropertyRow(table, "2XX Responses", Utilities.formatNumber(router.data.responses_2xx));
        Application.addPropertyRow(table, "3XX Responses", Utilities.formatNumber(router.data.responses_3xx));
        Application.addPropertyRow(table, "4XX Responses", Utilities.formatNumber(router.data.responses_4xx));
        Application.addPropertyRow(table, "5XX Responses", Utilities.formatNumber(router.data.responses_5xx));
        Application.addPropertyRow(table, "XXX Responses", Utilities.formatNumber(router.data.responses_xxx));
    },

    refreshDropletExecutionAgentsPage: function(reload)
    {
        this.getData(this.URL__DROPLET_EXECUTION_AGENTS, reload).done(function(result)
        {
            Application.refreshTab(Application.ID__DROPLET_EXECUTION_AGENTS, [result], reload);
        });
    },

    getDropletExecutionAgentsTableData: function(results)
    {
        return this.getTableData(results, this.ID__DROPLET_EXECUTION_AGENTS);
    },

    getDropletExecutionAgentsRow: function(row, dropletExecutionAgent)
    {
        row.push(dropletExecutionAgent.name);

        if (dropletExecutionAgent.connected)
        {
            row.push(this.STATUS__RUNNING);
            row.push(dropletExecutionAgent.data.start);
            row.push(dropletExecutionAgent.data.cpu);
            row.push(dropletExecutionAgent.data.mem);
            // V1
            if ((dropletExecutionAgent.data.num_apps != null) && (dropletExecutionAgent.data.apps_max_memory != null) && (dropletExecutionAgent.data.apps_reserved_memory != null))
            {
                row.push(this.getDropletExecutionAgentDiskUsed(dropletExecutionAgent));
                row.push(dropletExecutionAgent.data.num_apps);
                row.push(dropletExecutionAgent.data.apps_max_memory);
                row.push(dropletExecutionAgent.data.apps_reserved_memory);
                var free = dropletExecutionAgent.data.apps_max_memory - dropletExecutionAgent.data.apps_reserved_memory;
                row.push(free);
                row.push(Math.round((free / dropletExecutionAgent.data.apps_max_memory) * 100));
                row.push(dropletExecutionAgent.data.apps_used_memory);
            }        
            // NG
            else
            {
                row.push(0);
                row.push(0);
                row.push(0);
                row.push(0);
                row.push(0);
                row.push(0);
                row.push(0);
            }

            row.push(dropletExecutionAgent);
        }
        else
        {
            row.push(this.STATUS__OFFLINE);

            this.addEmptyElementsToArray(row, 11);

            row.push(dropletExecutionAgent.uri);
        }
    },

    getDropletExecutionAgentDiskUsed: function(dea)
    {
        var result = 0;

        if ((dea != null) && (dea.data != null) && (dea.data.runtimes != null))
        {
            for (var runtimeIndex in dea.data.runtimes)
            {
                var runtime = dea.data.runtimes[runtimeIndex];

                result += runtime.used_disk;
            }
        }

        return result;
    },

    dropletExecutionAgentClicked: function()
    {
        Application.itemClicked("DropletExecutionAgent", 12, false);
    },

    handleDropletExecutionAgentClicked: function(table, dropletExecutionAgent, row)
    {
        Application.addPropertyRow(table, "Name",    Application.formatString(dropletExecutionAgent.name), true);
        Application.addLinkRow(table,     "URI",     Application.formatString(dropletExecutionAgent.uri));
        Application.addPropertyRow(table, "Host",    Application.formatString(dropletExecutionAgent.data.host));
        Application.addPropertyRow(table, "Started", Utilities.formatDateString(dropletExecutionAgent.data.start));
        Application.addPropertyRow(table, "Uptime",  Application.formatUptime(dropletExecutionAgent.data.uptime));
        Application.addPropertyRow(table, "Cores",   Utilities.formatNumber(dropletExecutionAgent.data.num_cores));
        Application.addPropertyRow(table, "CPU",     Utilities.formatNumber(dropletExecutionAgent.data.cpu));
        Application.addPropertyRow(table, "Memory",  Utilities.formatNumber(dropletExecutionAgent.data.mem));

        // V1
        if ((dropletExecutionAgent.data.num_apps != null) && (dropletExecutionAgent.data.apps_max_memory != null) && (dropletExecutionAgent.data.apps_reserved_memory != null))
        {
            Application.addPropertyRow(table, "Disk",    Utilities.formatNumber(Application.getDropletExecutionAgentDiskUsed(dropletExecutionAgent)));

            var appsLink = document.createElement("a");
            $(appsLink).attr("href", "");
            $(appsLink).addClass("tableLink");
            $(appsLink).html(Utilities.formatNumber(dropletExecutionAgent.data.num_apps));
            $(appsLink).click(function()
            {
                Application.showApplications(Application.formatString(dropletExecutionAgent.name));

                return false;
            });
            Application.addRow(table, "Apps", appsLink);

            Application.addPropertyRow(table, "Apps Max Memory",      Utilities.formatNumber(dropletExecutionAgent.data.apps_max_memory));
            Application.addPropertyRow(table, "Apps Reserved Memory", Utilities.formatNumber(dropletExecutionAgent.data.apps_reserved_memory));
            Application.addPropertyRow(table, "Apps Free Memory",     Utilities.formatNumber(row[9]) + " (" + Utilities.formatNumber(row[10]) + "%)");       
            Application.addPropertyRow(table, "Apps Used Memory",     Utilities.formatNumber(dropletExecutionAgent.data.apps_used_memory));
        }
    },

    showDropletExecutionAgent: function(dropletExecutionAgentIndex)
    {
        // Several calls in this function trigger a saveTableScrollPosition() which corrupts the scroll position.
        Application.ignoreScroll = true;

        // Save and clear the sorting so we can select by index.
        var sorting = this.dropletExecutionAgentsTable.fnSettings().aaSorting;
        this.dropletExecutionAgentsTable.fnSort([]);

        var deferred = this.getData(this.URL__DROPLET_EXECUTION_AGENTS, false);

        deferred.done(function(result)
        {
            var tableData = Application.getDropletExecutionAgentsTableData([result]);
            Application.dropletExecutionAgentsTable.fnClearTable();
            Application.dropletExecutionAgentsTable.fnAddData(tableData);

            // Select the droplet execution agent.
            Application.selectTableRow(Application.dropletExecutionAgentsTable, dropletExecutionAgentIndex);

            // Restore the sorting.
            Application.dropletExecutionAgentsTable.fnSort(sorting);

            // Move to the Droplet Execution Agents tab.
            Application.setTabSelected(Application.ID__DROPLET_EXECUTION_AGENTS);

            // Show the Droplet Execution Agents tab contents.
            Application.showPage(Application.ID__DROPLET_EXECUTION_AGENTS,
                                 function()
                                 {
                                     Application.dropletExecutionAgentsTable.fnDraw();
                                 });

            Application.ignoreScroll = false;

            Application.scrollSelectedTableRowIntoView(Application.ID__DROPLET_EXECUTION_AGENTS);  
        });
    },

    handleCreateNewDEA: function()
    {
        Application.showDialog("Confirmation", "Are you sure you want to create a new DEA?", Application.createDEA);
    },

    createDEA: function()
    {
        var deferred = $.ajax({
                                  url: "dropletExecutionAgent",
                                  dataType: "json",
                                  type: "POST"
                              });

        deferred.done(function(response, status)
        {  
            //Application.showDialog("Information", "A task to create a new DEA has been started.");

            Application.hideDialog();
        });

        deferred.fail(function(xhr, status, error)
        {
            Application.showDialog("Error", "There was an error starting the task: <br/><br/>" + error);
        });
    },


    refreshApplicationsPage: function(reload)
    {
        var healthManagerDeferred         = this.getData(this.URL__HEALTH_MANAGERS,          reload);
        var dropletExecutionAgentDeferred = this.getData(this.URL__DROPLET_EXECUTION_AGENTS, reload);

        $.when(healthManagerDeferred, dropletExecutionAgentDeferred).done(function(healthManagerResult, dropletExecutionResult)
        {
            Application.refreshTab(Application.ID__APPLICATIONS, [healthManagerResult, dropletExecutionResult], reload);
        });
    },

    getApplicationsTableData: function(results)
    {
        var healthManagers         = results[0].response;
        var dropletExecutionAgents = results[1].response;

        var tableData = new Array();
        var appMap    = new Array();


        // Add applications from the Health Manager first so we get all app.
        // When we go through the DEA apps we will overwrite the STARTED apps
        // with those that are running on a DEA.
        if (healthManagers != null)
        {
            for (var healthManagerIndex in healthManagers)
            {
                var healthManager = healthManagers[healthManagerIndex];

                if (healthManager.connected)
                {
                    for (var appIndex in healthManager.data.apps)
                    {
                        var app = healthManager.data.apps[appIndex];

                        var row = new Array();

                        row.push(app.name);
                        row.push(app.state);

                        Application.addEmptyElementsToArray(row, 2);

                        row.push([app.user]);

                        Application.addEmptyElementsToArray(row, 7);

                        row.push(-1);
                        row.push(app);

                        appMap[app.droplet_id] = tableData.length;
                        tableData.push(row);
                    }
                }
            }
        }


        if (dropletExecutionAgents != null)
        {
            var numDropletExecutionAgents = dropletExecutionAgents.length;

            for (var dropletExecutionAgentIndex = 0; dropletExecutionAgentIndex < numDropletExecutionAgents; dropletExecutionAgentIndex++)
            {
                var dropletExecutionAgent = dropletExecutionAgents[dropletExecutionAgentIndex];

                if (dropletExecutionAgent.data != null)
                {
                    for (var appIndex in dropletExecutionAgent.data.running_apps)
                    {
                        var app = dropletExecutionAgent.data.running_apps[appIndex];

                        var row = new Array();

                        row.push(app.name);
                        row.push(app.state);
                        row.push(app.start);
                        row.push(app.uris);
                        row.push(app.users);
                        row.push(app.framework);
                        row.push(app.runtime);
                        row.push(app.usage.cpu);
                        //row.push(app.usage.mem);
                        row.push(app.mem_quota);
                        row.push(app.usage.disk);
                        row.push(app.instance_index);
                        row.push(dropletExecutionAgent.name);

                        row.push(dropletExecutionAgentIndex);
                        row.push(app);

                        var append = true;

                        if (app.instance_index == 0)
                        {                        
                            var index = appMap[app.droplet_id];

                            if (index != null)
                            {              
                                tableData[index] = row;
                                append = false;
                            }   
                        }

                        if (append)
                        {
                            tableData.push(row);
                        }
                    }
                }
            }
        }


        return tableData;
    },

    applicationClicked: function()
    {
        Application.itemClicked("Application", 13, true);
    },

    handleApplicationClicked: function(table, app, row)
    {
        if (app.state == Application.STATUS__RUNNING)
        {
            //Application.addPropertyRow(table, "Name", Application.formatString(selected[0][0]), true);

            var details = document.createElement("div");
            $(details).append(document.createTextNode(Application.formatString(app.name)));

            var detailsLink = document.createElement("img");
            $(detailsLink).attr("src", "images/details.gif");
            $(detailsLink).css("cursor", "pointer");
            $(detailsLink).css("margin-left", "5px");
            $(detailsLink).css("vertical-align", "middle");
            $(detailsLink).height(14);
            $(detailsLink).click(function()
            {
                var page = window.open("", "_blank", "fullscreen=yes,menubar=no,scrollbars=yes,titlebar=no,toolbar=no");
                page.document.write("<pre>" + JSON.stringify(app, null, 4) + "</pre>");
                page.document.close();
            });
            $(details).append(detailsLink);
            Application.addRow(table, "Name", details, true);

            Application.addStatusRow(table, "State", app.state);

            for (var index in app.uris)
            {
                var uri = "http://" + app.uris[index];

                var link = document.createElement("a");
                $(link).attr("target", "_blank");
                $(link).attr("href", uri);
                $(link).addClass("tableLink");
                $(link).html(uri);

                Application.addRow(table, "URI", link);
            }

            Application.addPropertyRow(table, "Port", Utilities.formatNumber(app.port));

            for (var index in app.users)
            {
                var user = app.users[index];

                var link = document.createElement("a");
                $(link).attr("href", "");
                $(link).addClass("tableLink");
                $(link).html(user);
                $(link).click(function()
                {
                    Application.showUser(user);

                    return false;
                });
                Application.addRow(table, "User", link);
            }

            Application.addPropertyRow(table, "Framework",       Application.formatString(app.framework));
            Application.addPropertyRow(table, "Runtime",         Application.formatString(app.runtime));
            Application.addPropertyRow(table, "Started",         Utilities.formatDateString(app.start));
            Application.addPropertyRow(table, "CPU",             Utilities.formatNumber(app.usage.cpu));
            Application.addPropertyRow(table, "Memory Reserved", Utilities.formatNumber(app.mem_quota));
            Application.addPropertyRow(table, "Memory Used",     Utilities.formatNumber(app.usage.mem));
            Application.addPropertyRow(table, "Disk Reserved",   Utilities.formatNumber(app.disk_quota));
            Application.addPropertyRow(table, "Disk Used",       Utilities.formatNumber(app.usage.disk));
            Application.addPropertyRow(table, "Droplet ID",      Application.formatString(app.droplet_id));
            Application.addPropertyRow(table, "Instance ID",     Application.formatString(app.instance_index));
            Application.addPropertyRow(table, "PID",             Application.formatString(app.pid));

            var dropletExecutionAgent = Application.formatString(row[11]);
            var dropletExecutionAgentLink = document.createElement("a");
            $(dropletExecutionAgentLink).attr("href", "");
            $(dropletExecutionAgentLink).addClass("tableLink");
            $(dropletExecutionAgentLink).html(dropletExecutionAgent);
            $(dropletExecutionAgentLink).click(function()
            {
                Application.showDropletExecutionAgent(row[12]);

                return false;
            });
            Application.addRow(table, "DEA", dropletExecutionAgentLink);
        }
        else
        {
            Application.addPropertyRow(table, "Name", Application.formatString(app.name), true);

            Application.addStatusRow(table, "State", app.state);

            var link = document.createElement("a");
            $(link).attr("href", "");
            $(link).addClass("tableLink");
            $(link).html(app.user);
            $(link).click(function()
            {
                Application.showUser(app.user);

                return false;
            });
            Application.addRow(table, "User", link);

            Application.addPropertyRow(table, "Droplet ID", Application.formatString(app.droplet_id));
        }
    },

    showApplications: function(filter)
    {
        this.setTabSelected(this.ID__APPLICATIONS);

        this.hideDetails("Application");

        var healthManagerDeferred         = this.getData(this.URL__HEALTH_MANAGERS,          false);
        var dropletExecutionAgentDeferred = this.getData(this.URL__DROPLET_EXECUTION_AGENTS, false);

        $.when(healthManagerDeferred, dropletExecutionAgentDeferred).done(function(healthManagerResult, dropletExecutionResult)
        {
            var tableData = Application.getApplicationsTableData([healthManagerResult, dropletExecutionResult]);

            Application.applicationsTable.fnClearTable();
            Application.applicationsTable.fnAddData(tableData);

            Application.applicationsTable.fnFilter(filter);

            Application.showPage(Application.ID__APPLICATIONS,
                                 function()
                                 {
                                     Application.applicationsTable.fnDraw();
                                 });
        });
    },

    refreshUsersPage: function(reload)
    {
        var healthManagerDeferred         = this.getData(this.URL__HEALTH_MANAGERS,          reload);
        var dropletExecutionAgentDeferred = this.getData(this.URL__DROPLET_EXECUTION_AGENTS, reload);

        $.when(healthManagerDeferred, dropletExecutionAgentDeferred).done(function(healthManagerResult, dropletExecutionResult)
        {
            Application.refreshTab(Application.ID__USERS, [healthManagerResult, dropletExecutionResult], reload);
        });
    },

    getUsersTableData: function(results)
    {
        var healthManagers         = results[0].response;
        var dropletExecutionAgents = results[1].response;

        var userApps = new Array();


        if (healthManagers != null)
        {
            for (var healthManagerIndex in healthManagers)
            {
                var healthManager = healthManagers[healthManagerIndex];

                if (healthManager.data != null)
                {
                    for (var appIndex in healthManager.data.apps)
                    {
                        var app = healthManager.data.apps[appIndex];

                        var user = app.user;

                        var userApplications = userApps[user];

                        if (userApplications == null)
                        {
                            userApps[user] = new Array();
                        }

                        // Simulate instance_index 0 for supported override by the running apps below
                        userApps[user][app.name + ".0"] = app;
                    }

                    // Add users that don't have any apps...
                    for (var userIndex in healthManager.data.users)
                    {
                        var userEntry =  healthManager.data.users[userIndex];
  
                        var user = userEntry.email;
  
                        var apps = userApps[user];
  
                        if (apps == null)
                        {
                            userApps[user] = new Array();
                        }
                    }
                }
            }
        }


        // Add the users with running apps...
        if (dropletExecutionAgents != null)
        {
            for (var dropletExecutionAgentIndex in dropletExecutionAgents)
            {
                var dropletExecutionAgent = dropletExecutionAgents[dropletExecutionAgentIndex];

                if (dropletExecutionAgent.data != null)
                {
                    for (var appIndex in dropletExecutionAgent.data.running_apps)
                    {
                        var app = dropletExecutionAgent.data.running_apps[appIndex];

                        for (var userIndex in app.users)
                        {
                            var user = app.users[userIndex];

                            var userApplications = userApps[user];

                            if (userApplications == null)
                            {
                                userApps[user] = new Array();
                            }

                            // Each instance of a running app takes resources
                            userApps[user][app.name + "." + app.instance_index] = app;
                        }
                    }
                }
            }
        }


        var tableData = new Array();

        for (var user in userApps)
        {
            var apps = userApps[user];

            var totalApps = Object.keys(apps).length;

            var running = 0;
            var stopped = 0;

            var cpu         = 0;
            var memoryQuota = 0;
            var memoryUsed  = 0;
            var diskQuota   = 0;
            var diskUsed    = 0;

            for (var appIndex in apps)
            {
                var app = apps[appIndex];

                if (app.state == this.STATUS__RUNNING)
                {
                    running++;
                }
                else if (app.state == this.STATUS__STOPPED)
                {
                    stopped++;
                }

                if (app.usage != null)
                {
                    cpu         += app.usage.cpu;
                    memoryQuota += app.mem_quota;
                    memoryUsed  += app.usage.mem;
                    diskQuota   += app.disk_quota;
                    diskUsed    += app.usage.disk;
                }
            }

            var row = new Array();

            row.push(user);
            row.push(totalApps);
            row.push(running);
            row.push(stopped);
            row.push(totalApps - running - stopped);
            row.push(cpu);
            row.push(memoryQuota);
            row.push(memoryUsed);
            row.push(memoryQuota - memoryUsed);
            row.push(diskQuota);
            row.push(diskUsed);
            row.push(diskQuota - diskUsed);

            tableData.push(row);
        }

        return tableData;
    },

    userClicked: function()
    {
        Application.itemClicked("User", -1, true);
    },

    handleUserClicked: function(table, user, row)
    {
        var email = "mailto:" + row[0];


        var link = document.createElement("a");
        $(link).attr("target", "_blank");
        $(link).attr("href", email);
        $(link).addClass("tableLink");
        $(link).html(email);
        Application.addRow(table, "Email", link, true);

        var apps = Application.formatString(row[1]);
        var appsLink = document.createElement("a");
        $(appsLink).attr("href", "");
        $(appsLink).addClass("tableLink");
        $(appsLink).html(apps);
        $(appsLink).click(function()
        {
            Application.showApplications(row[0]);

            return false;
        });
        Application.addRow(table, "Applications", appsLink);

        Application.addPropertyRow(table, "CPU",             Utilities.formatNumber(row[5]));
        Application.addPropertyRow(table, "Memory Reserved", Utilities.formatNumber(row[6]));
        Application.addPropertyRow(table, "Memory Used",     Utilities.formatNumber(row[7]));
        Application.addPropertyRow(table, "Memory Free",     Utilities.formatNumber(row[8]));
        Application.addPropertyRow(table, "Disk Reserved",   Utilities.formatNumber(row[9]));
        Application.addPropertyRow(table, "Disk Used",       Utilities.formatNumber(row[10]));
        Application.addPropertyRow(table, "Disk Free",       Utilities.formatNumber(row[11]));
    },

    showUser: function(email)
    {
        // Several calls in this function trigger a saveTableScrollPosition() which corrupts the scroll position.
        Application.ignoreScroll = true;

        // Save and clear the sorting so we can select by index.
        var sorting = this.usersTable.fnSettings().aaSorting;
        this.usersTable.fnSort([]);

        var healthManagerDeferred         = this.getData(this.URL__HEALTH_MANAGERS,          false);
        var dropletExecutionAgentDeferred = this.getData(this.URL__DROPLET_EXECUTION_AGENTS, false);

        $.when(healthManagerDeferred, dropletExecutionAgentDeferred).done(function(healthManagerResult, dropletExecutionResult)
        {
            var tableData = Application.getUsersTableData([healthManagerResult, dropletExecutionResult]);
            Application.usersTable.fnClearTable();
            Application.usersTable.fnAddData(tableData);

            for (var index = 0; index < tableData.length; index++)
            {
                var user = tableData[index];

                if (user[0] == email)
                {           
                    // Select the user.
                    Application.selectTableRow(Application.usersTable, index);

                    // Restore the sorting.
                    Application.usersTable.fnSort(sorting);

                    // Move to the Users tab.
                    Application.setTabSelected(Application.ID__USERS);

                    // Show the Users tab contents.
                    Application.showPage(Application.ID__USERS,
                                         function()
                                         {
                                             Application.usersTable.fnDraw();
                                         });

                    Application.ignoreScroll = false;

                    Application.scrollSelectedTableRowIntoView(Application.ID__USERS);                  

                    break;
                }
            }
        });
    },

    refreshComponentsPage: function(reload)
    {
        this.getData(this.URL__COMPONENTS, reload).done(function(result)
        {
            Application.refreshTab(Application.ID__COMPONENTS, [result], reload);
        });
    },

    getComponentsTableData: function(results)
    {
        return this.getTableData(results, this.ID__COMPONENTS);
    },

    getComponentsRow: function(row, component)
    {
        row.push(component.name);
        row.push(component.data.type);
        row.push((component.data.start != null ? component.data.start : ""));
        row.push(component.connected ? this.STATUS__RUNNING : this.STATUS__OFFLINE);        
        row.push(component);
        row.push(component.uri);
    },

    componentClicked: function()
    {
        Application.itemClicked("Component", 4, true);
    },

    handleComponentClicked: function(table, component, row)
    {
        Application.addPropertyRow(table, "Name",    component.name, true);
        Application.addPropertyRow(table, "Type",    component.data.type);
        Application.addPropertyRow(table, "Started", Utilities.formatDateString(component.data.start));
        Application.addLinkRow(table,     "URI",     Application.formatString(component.uri));
        Application.addStateRow(table,    "State",   row[3]);
    },

    handleRemoveAllItems: function()
    {
        Application.showDialog("Confirmation", "Are you sure you want to remove all cached components?", 
                               function()
                               {
                                   Application.removeItem();
                               });
    },


    refreshLogsPage: function(reload)
    {
        this.getData(this.URL__LOGS, reload).done(function(result)
        {
            Application.refreshTab(Application.ID__LOGS, [result], reload);
        });
    },

    getLogsTableData: function(results)
    {
        return this.getTableData(results, this.ID__LOGS);
    },

    getLogsRow: function(row, log)
    {
        row.push(log.path);
        row.push(log.size);
        row.push(log.time);

        row.push(log);
    },

    logClicked: function()
    {
        var tableTools = TableTools.fnGetInstance("LogsTable");

        var selected = tableTools.fnGetSelectedData();

        if (selected.length > 0)
        {
            var logFile = selected[0][3];

            if (Application.refreshingTab)
            {
                Application.retrieveLog(logFile.path, Application.currentLog.start, false, true);
            }
            else
            {
                Application.retrieveLog(logFile.path, -1, true, false);
            }
        }
        else
        {
            if (!Application.refreshingTab)
            {
                $("#LogContainer").hide();

                Application.currentLog = null;
            }
        }
    },

    retrieveLog: function(logPath, start, forward, refreshing)
    {
        var ajaxDeferred = $.ajax({
                                      url: Application.URL__LOG + "?path=" + logPath + "&start=" + start,
                                      dataType: "json"
                                  });

        ajaxDeferred.done(function(log, status)
        {
            Application.handleLogRetrievedSuccessfully(log, forward, refreshing);
        });

        ajaxDeferred.fail(function(xhr, status, error)
        {

        });
    },

    handleLogRetrievedSuccessfully: function(log, forward, refreshing)
    {
        // log = {path, start, pageSize, fileSize, data}
        Application.currentLog = log;


        $("#LogContents").text(log.data);

        $("#LogLink").text(log.path);
        $("#LogLink").attr("href", "download?path=" + log.path);

        $("#LogContainer").show();

        Application.resizeLogsPage();

        if (refreshing)
        {
            $("#LogContents").scrollTop(Application.currentLog.scrollTop);
            //$("#LogContents").scrollLeft(Application.currentLog.scrollLeft);
        }
        else
        {
            var scrollTop  = 0;
            //var scrollLeft = 0;

            if (forward || (Application.currentLog.last == null))
            {
                scrollTop = $("#LogContents")[0].scrollHeight;
                //scrollLeft = $("#LogContents")[0].scrollWidth;
            }

            $("#LogContents").scrollTop(scrollTop);
            //$("#LogContents").scrollLeft(scrollLeft);

            //$("#LogContents").scrollTop(forward ? $("#LogContents")[0].scrollHeight : 0);
        }
    },

    resizeLogsPage: function()
    {
        var windowHeight = $(window).height();

        var tablePosition = $("#LogsTableContainer").offset();
        var tableHeight   = $("#LogsTableContainer").outerHeight(true);

        var height = windowHeight - tablePosition.top - tableHeight - 60;

        $("#LogContents").height(Math.max(height, 300));


        if (Application.currentLog != null)
        {
            Application.initializeLogButton("first");
            Application.initializeLogButton("back");
            Application.initializeLogButton("forward");
            Application.initializeLogButton("last");

            var fileSize = Application.currentLog.fileSize;
            var readSize = Application.currentLog.readSize;
            var start    = Application.currentLog.start;


            var containerLeft = $("#LogScrollBarContainer").position().left;
            var containerWidth = $("#LogScrollBarContainer").width();

            var left  = 0;
            var width = containerWidth;

            if (fileSize > 0)
            {
                left  = Math.round((containerWidth *    start) / fileSize);
                width = Math.round((containerWidth * readSize) / fileSize);

                width = Math.max(width, 10);
                left  = Math.min(left,  (containerWidth - width));
            }

            $("#LogScrollBar").css({
                                       left:  left  + "px",
                                       width: width + "px"
                                   });
        }
    },

    initializeLogButton: function(type)
    {
        var upperCaseType = type.charAt(0).toUpperCase() + type.slice(1);

        var imageSuffix = "";

        if (Application.currentLog[type] == null)
        {
            imageSuffix = "_disabled";

            $("#Log" + upperCaseType + "Button").addClass("logButtonDisabled");
        }
        else
        {
            $("#Log" + upperCaseType + "Button").removeClass("logButtonDisabled");
        }

        $("#Log" + upperCaseType + "ButtonImage").attr("src", "images/" + type + imageSuffix + ".png");
    },

    handleLogFirstClicked: function()
    {
        if (!$("#LogFirstButton").hasClass("logButtonDisabled"))
        {
            Application.retrieveLog(Application.currentLog.path, Application.currentLog.first, false, false);
        }
    },

    handleLogBackClicked: function()
    {
        if (!$("#LogBackButton").hasClass("logButtonDisabled"))
        {
            Application.retrieveLog(Application.currentLog.path, Application.currentLog.back, false, false);
        }
    },

    handleLogForwardClicked: function()
    {
        if (!$("#LogForwardButton").hasClass("logButtonDisabled"))
        {
            Application.retrieveLog(Application.currentLog.path, Application.currentLog.forward, true, false);
        }
    },

    handleLogLastClicked: function()
    {
        if (!$("#LogLastButton").hasClass("logButtonDisabled"))
        {
            Application.retrieveLog(Application.currentLog.path, Application.currentLog.last, true, false);
        }
    },

    handleLogScrolled: function()
    {
        Application.currentLog.scrollTop = $("#LogContents").scrollTop();
        //Application.currentLog.scrollLeft = $("#LogContents").scrollLeft();
    },

    startLogScrollbar: function(e)
    {
        Application.dragObject = this;

        e = Application.fixEvent(e);
        Application.dragObject.lastMouseX = e.clientX;

        document.onmousemove = Application.dragLogScrollbar;
        document.onmouseup   = Application.stopLogScrollbar;

        return false;
    },

    fixEvent: function(e)
    {
       if (typeof e == "undefined") e = window.event;
       if (typeof e.layerX == "undefined") e.layerX = e.offsetX;
       return e;
    },

    dragLogScrollbar: function(e)
    {
       e = Application.fixEvent(e);

       var mouseX = e.clientX;
       var diffX = mouseX - Application.dragObject.lastMouseX;

       var containerWidth = $("#LogScrollBarContainer").width();
       var scrollbarWidth = $("#LogScrollBar").width();

       var newX = parseInt(Application.dragObject.style.left) + diffX;

       newX = Math.max(newX, 0);
       newX = Math.min(newX, containerWidth - scrollbarWidth);

       Application.dragObject.style.left = newX + "px";

       Application.dragObject.lastMouseX = mouseX;
       Application.dragObject.lastDiffX  = diffX;
    },

    stopLogScrollbar: function()
    {
       var forward = Application.dragObject.lastDiffX > 0;

       var containerWidth = $("#LogScrollBarContainer").width();
       var scrollbarLeft  = parseInt(Application.dragObject.style.left);

       var start = Math.round((scrollbarLeft * Application.currentLog.fileSize) / containerWidth);

       Application.retrieveLog(Application.currentLog.path, start, forward, false);

       document.onmousemove = null;
       document.onmouseup   = null;

       Application.dragObject = null;
    },


    refreshTasksPage: function(reload)
    {
        reload = true;

        this.getData(this.URL__TASKS, reload).done(function(result)
        {
            Application.refreshTab(Application.ID__TASKS, [result], reload);

            var refresh = false;

            for (var index in result.response)
            {
                var task = result.response[index];

                if (task.state == Application.STATUS__RUNNING)
                {
                    refresh = true;
                    break;
                }
            }

            if (refresh)
            {
                setTimeout(function()
                           {
                               if ($("#Tasks").hasClass("menuItemSelected"))
                               {
                                   Application.refreshTasksPage(true);
                               }
                           },
                           Application.settings.tasksRefreshInterval);   
            }
        });
    },

    getTasksTableData: function(results)
    {
        return this.getTableData(results, this.ID__TASKS);
    },

    getTasksRow: function(row, task)
    {
        row.push(task.command);
        row.push(task.state);
        row.push(task.started);

        row.push(task.id);
    },

    taskClicked: function()
    {
        var tableTools = TableTools.fnGetInstance("TasksTable");

        var selected = tableTools.fnGetSelectedData();

        if (selected.length > 0)
        {
            var taskID = selected[0][3];

            Application.retrieveTask(taskID, false);
        }
        else
        {
            if (!Application.refreshingTab)
            {
                $("#TaskContainer").hide();

                if (Application.taskDeferred != null)
                {
                    Application.taskDeferred.abort();
                }
            }
        }
    },

    retrieveTask: function(taskID, updates)
    {
        if (Application.taskDeferred != null)
        {
            Application.taskDeferred.abort();
        }

        Application.taskDeferred = $.ajax({
                                              url: "taskStatus",
                                              dataType: "json",
                                              data: {taskID: taskID, updates: updates},
                                              type: "GET"
                                          });

        Application.taskDeferred.done(function(task, status)
        {
            Application.handleTaskRetrievedSuccessfully(task, updates);
        });

        Application.taskDeferred.fail(function(xhr, status, error)
        {

        });
    },

    handleTaskRetrievedSuccessfully: function(task, updates)
    {
        var showTimestamps     = $("#TaskShowTimestamps").prop("checked");
        var showStandardOutput = $("#TaskShowStandardOut").prop("checked");
        var showStandardError  = $("#TaskShowStandardError").prop("checked");

        var contents = updates ? $("#TaskContents").text() : "";

        for (var index in task.output)
        {
            var row = task.output[index];

            if (row.text != null)
            {
                if (((row.type == "out") && showStandardOutput) || ((row.type == "err") && showStandardError))
                {
                    if (showTimestamps)
                    {
                        contents += Utilities.formatDateNumber(row.time, true) + " ";
                    }

                    if (showStandardOutput && showStandardError)
                    {
                        contents += "[" + row.type + "] ";
                    }

                    contents += row.text;
                }
            }
        }

        $("#TaskContents").text(contents); 

        $("#TaskContainer").show();

        Application.resizeTasksPage();

        if ($("#Tasks").hasClass("menuItemSelected"))
        {
            if (task.state == Application.STATUS__RUNNING)
            {
                Application.retrieveTask(task.id, true);
            }
            // We have to let the auto refresh on the page change the status of the selected
            // task because for some reason fnUpdate causes a saveTableScrollPosition() to
            // be called and wrapping the flags around it doesn't prevent it either.
            /*
            else
            {
  
                var tableTools = TableTools.fnGetInstance("TasksTable");
                var selected = tableTools.fnGetSelected();                  
                              
                Application.ignoreScroll = true;
                Application.tasksTable.fnUpdate(Application.STATUS__FINISHED, selected[0], 1);
                Application.ignoreScroll = false;
            }
            */
        }
    },

    handleTaskCheckboxClicked: function()
    {
        Application.taskClicked();
    },

    resizeTasksPage: function()
    {
        var windowHeight = $(window).height();

        var tablePosition = $("#TasksTableContainer").offset();
        var tableHeight   = $("#TasksTableContainer").outerHeight(true);

        var height = windowHeight - tablePosition.top - tableHeight - 40;

        $("#TaskContents").height(Math.max(height, 300));
    },

    refreshStatsPage: function(reload)
    {
        this.getData(this.URL__STATS, reload).done(function(result)
        {
            Application.refreshTab(Application.ID__STATS, [result], reload);

            Application.buildStatsChart(result.response);
        });
    },

    buildStatsChart: function(items)
    {
        var stats = Utilities.buildStatsData(items);

        Application.statsChart = Utilities.createStatsChart("StatsChart", stats);

        Application.resizeStatsPage();

        //Utilities.hideChartSeries("StatsChart", [1, 4]);
    },

    getStatsTableData: function(results)
    {
        return this.getTableData(results, this.ID__STATS);
    },

    getStatsRow: function(row, item)
    {
        row.push(item.timestamp);
        row.push(item.users);
        row.push(item.users_with_apps);
        row.push(item.apps);
        row.push(item.running_instances);
        row.push(item.total_instances);
        row.push(item.deas);
    },

    handleCreateNewStats: function()
    {
        var deferred = $.ajax({
                                  url: "currentStatistics",
                                  dataType: "json",
                                  type: "GET"
                              });

        deferred.done(function(stats, status)
        {            
            var text = "The following stats will be added:<br/><br/>";

            //text += "<pre>" + JSON.stringify(stats, null, 4) + "</pre>";

            text += "<span style='margin-left: 5px;'>" + Utilities.formatDateNumber(stats.timestamp) + "</span>";

            text += "<div style='background-color: rgb(235, 235, 235); border: 1px rgb(220, 220, 220) inset; padding: 10px; margin-top: 5px;'>";
            text += "  <table cellpadding='3'>";
            text += "    <tr style='border-bottom: 1px solid rgb(190, 190, 190);'>";
            text += "      <td>Total Users:</td>";
            text += "      <td class='cellRightAlign'>" + Utilities.formatNumber(stats.users) + "</td>";
            text += "    </tr>";
            text += "    <tr style='border-bottom: 1px solid rgb(190, 190, 190);'>";
            text += "      <td>Users with apps:</td>";
            text += "      <td class='cellRightAlign'>" + Utilities.formatNumber(stats.users_with_apps) + "</td>";
            text += "    </tr>";
            text += "    <tr style='border-bottom: 1px solid rgb(190, 190, 190);'>";
            text += "      <td>Apps:</td>";
            text += "      <td class='cellRightAlign'>" + Utilities.formatNumber(stats.apps) + "</td>";
            text += "    </tr>";
            text += "    <tr style='border-bottom: 1px solid rgb(190, 190, 190);'>";
            text += "      <td>Running Instances:</td>";
            text += "      <td class='cellRightAlign'>" + Utilities.formatNumber(stats.running_instances) + "</td>";
            text += "    </tr>";
            text += "    <tr style='border-bottom: 1px solid rgb(190, 190, 190);'>";
            text += "      <td>Total Instances:</td>";
            text += "      <td class='cellRightAlign'>" + Utilities.formatNumber(stats.total_instances) + "</td>";
            text += "    </tr>";
            text += "    <tr>";
            text += "      <td>DEAs:</td>";
            text += "      <td class='cellRightAlign'>" + Utilities.formatNumber(stats.deas) + "</td>";
            text += "    </tr>";
            text += "  </table>"; 
            text += "</div>";

            Application.showDialog("Confirmation", text, function() { Application.createStats(stats); });
        });

        deferred.fail(function(xhr, status, error)
        {
            Application.showDialog("Information", "The system is unable to generate statistics at this time.<br/><br/>Make sure all Health Managers are online.");
        });   
    },

    createStats: function(stats)
    {
        var deferred = $.ajax({
                                  url: "statistics",
                                  dataType: "json",
                                  type: "POST",
                                  data: stats
                              });

        deferred.done(function(response, status)
        {  
            Application.refreshButton();

            Application.hideDialog();
        });

        deferred.fail(function(xhr, status, error)
        {
            Application.showDialog("Error", "There was an error saving the statistics: <br/><br/>" + error);
        });
    },

    resizeStatsPage: function()
    {
        var windowHeight = $(window).height();
        var windowWidth  = $(window).width();

        var tablePosition = $("#StatsContainer").position();
        var tableHeight   = $("#StatsContainer").outerHeight(true);
        var tableWidth    = $("#StatsContainer").outerWidth(true);

        var maxHeight = windowHeight - tablePosition.top  - tableHeight - 50;        
        var maxWidth  = windowWidth  - tablePosition.left - tableWidth  - 50;        

        var minChartWidth  = 500;
        var minChartHeight = 260;

        if (windowWidth > (tableWidth + tablePosition.left + minChartWidth))
        {
            $("#StatsChart").width(maxWidth);
            $("#StatsChart").height(Math.max(tableHeight - 40, minChartHeight));
        }
        else
        {
            $("#StatsChart").width(tableWidth - 40);
            $("#StatsChart").height(Math.max(maxHeight, minChartHeight));
        }

        Application.statsChart.replot({resetAxes: true});
    },


    createPropertyTable: function(containerDiv)
    {
        var table = document.createElement("table");
        table.cellSpacing = "0";
        table.cellPadding = "0";

        containerDiv.appendChild(table);

        return table;
    },

    addPropertyRow: function(table, key, value, first)
    {
        this.addRow(table, key, document.createTextNode(value), first);
    },

    addStatusRow: function(table, key, value, first)
    {
        var span = document.createElement("span");
        span.appendChild(document.createTextNode(value));

        if (value == this.STATUS__STOPPED)
        {
            span.style.color = "rgb(200, 0, 0)";
        }
        else if (value != this.STATUS__RUNNING)
        {
            span.style.color = "rgb(250, 100, 0)";
        }

        this.addRow(table, key, span, first);
    },

    addStateRow: function(table, key, value, first)
    {
        var span = document.createElement("span");
        span.appendChild(document.createTextNode(value));

        if (value == this.STATUS__OFFLINE)
        {
            span.style.color = "rgb(200, 0, 0)";
        }

        this.addRow(table, key, span, first);
    },

    addLinkRow: function(table, key, value, first)
    {
        var link = document.createElement("a");

        this.initializeLink(link, value);

        $(link).addClass("tableLink");

        this.addRow(table, key, link, first);
    },

    addRow: function(table, key, valueElement, first)
    {
        var tr = document.createElement("tr");

        var keyTD = document.createElement("td");
        tr.appendChild(keyTD);

        var valueTD = document.createElement("td");
        tr.appendChild(valueTD);

        keyTD.className = "propertyKeyCell";
        keyTD.innerHTML = key + ":";

        valueTD.className = "propertyValueCell";
        valueTD.appendChild(valueElement);

        if (first)
        {
            $(keyTD).addClass("firstPropertyKeyCell");
            $(valueTD).addClass("firstPropertyValueCell");
        }

        table.appendChild(tr);
    },

    formatURIs: function(values)
    {
        return Application.formatStrings(values, "http://");
    },

    formatUsers: function(values)
    {
        return Application.formatStrings(values, null);
    },

    formatStrings: function(values, prefix)
    {
        var html = "";

        if (values != null)
        {
            var first = true;

            for (var valueIndex in values)
            {
                if (first)
                {
                    first = false;
                }
                else
                {
                    html += "<br/>";
                }

                if (prefix != null)
                {
                    html += prefix;
                }

                html += values[valueIndex];
            }
        }

        return html;
    },

    /*
    formatURIs: function(values)
    {
        return Application.formatLinks(values, "<a target='_blank' href='http://");
    },

    formatUsers: function(values)
    {
        return Application.formatLinks(values, "<a href='mailto:");
    },

    formatLinks: function(values, prefix)
    {
        var html = "";

        if (values != null)
        {
            var first = true;

            for (var valueIndex in values)
            {
                if (first)
                {
                    first = false;
                }
                else
                {
                    html += "<br/>";
                }

                html += prefix + values[valueIndex] + "' class='tableLink'>" + values[valueIndex] + "</a>";
            }
        }

        return html;
    },
    */

    formatString: function(value)
    {
        return (value != null) ? value : "";
    },    

    formatUptime: function(uptime)
    {
        var result = "";

        if (uptime != null)
        {
            var sections = uptime.split(":");

            if (sections.length == 4)
            {
                sections[0] = parseInt(sections[0].replace("d", ""));
                sections[1] = parseInt(sections[1].replace("h", ""));
                sections[2] = parseInt(sections[2].replace("m", ""));
                sections[3] = parseInt(sections[3].replace("s", ""));

                result = sections[0].toString();

                if (sections[0] == 1)
                {
                    result += " day, ";
                }
                else
                {
                    result += " days, ";
                }

                result += this.padNumber(sections[1], 2) + ":";
                result += this.padNumber(sections[2], 2) + ":";
                result += this.padNumber(sections[3], 2);
            }
        }

        return result;
    },

    formatStatus: function(status, type, item)
    {
        var result = "<span";

        if ((status == Application.STATUS__STOPPED) ||
            (status == Application.STATUS__OFFLINE))
        {
            result += " style='color: rgb(200, 0, 0);'";
        }

        result += ">" + status;

        if (status == Application.STATUS__OFFLINE)
        {
            result += " <img src='images/remove.png' onclick='Application.removeItemConfirmation(\"" + item[item.length - 1] + "\")' class='removeButton' title='Remove " + item[item.length - 1] + "'/>";
        }

        result += "</span>";

        return result;
    },

    formatAvailableCapacity: function(capacity)
    {
        var color = "rgb(0, 190, 0)";

        if (capacity < 5)
        {
            color = "rgb(200, 0, 0)";
        }
        else if (capacity < 10)
        {
            color = "rgb(250, 100, 0)";
        }
        else if (capacity < 20)
        {
            color = "rgb(170, 160, 0)";
        }

        return "<span style='color: " + color + ";'>" + capacity + "</span>";
    },

    formatFreeMemory: function(free)
    {
        var style = "";

        if (free < 2048)
        {
            style = " style='color: rgb(200, 0, 0);'";
        }

        return "<span" + style + ">" + Utilities.formatNumber(free) + "</span>";
    },

    formatDEA: function(value)
    {
        var result = value;

        if ((value != null) && (value !== ""))
        {
            result += "<img onclick='Application.filterApplicationTable(event, \"" + value + "\");' src='images/filter.png' style='margin-left: 5px; vertical-align: middle;'>";
        }

        return result;
    },

    filterApplicationTable: function(event, value)
    {
        var tableTools = TableTools.fnGetInstance("ApplicationsTable");

        tableTools.fnSelectNone();

        this.applicationsTable.fnFilter(value);

        event.stopPropagation();

        return false;
    },

    hideDetails: function(type)
    {
        var container = $("#" + type + "PropertiesContainer");
        container.children().remove();

        $("#" + type + "DetailsLabel").hide();
    },

    padNumber: function(number, size)
    {
        var numberString = number.toString();

        while (numberString.length < size) numberString = "0" + numberString;

        return numberString;
    },

    addEmptyElementsToArray: function(array, number)
    {
        for (var index = 0; index < number; index++)
        {
            array.push("");
        }
    },

    getData: function(uri, reload)
    {
        var promise = null;

        if (this.cache[uri].retrieving)
        {
            promise = this.cache[uri].deferred.promise();
        }
        else if (reload)
        {
            var this_ = this;


            this.cache[uri].retrieving = true;

            this.cache[uri].response = null;
            this.cache[uri].error    = null;

            this.cache[uri].deferred = new $.Deferred();


            var ajaxDeferred = $.ajax({
                                          url: uri,
                                          dataType: "json"
                                      });

            ajaxDeferred.done(function(response, status)
            {
                this_.cache[uri].response = response.items;

                if (reload && (response.connected != null))
                {
                    if (!Application.connected && response.connected)
                    {                      
                        $(".disconnected").hide();
                        Application.connected = true;          
                    }
                    else if (Application.connected && !response.connected)
                    {
                        $(".disconnected").show();
                        Application.connected = false;                        
                    }
                }
            });

            ajaxDeferred.fail(function(xhr, status, error)
            {
                if (xhr.status == 303)
                {
                    window.location.href = "login.html";
                }
                else
                {
                    this_.cache[uri].error = error;
                }
            });

            ajaxDeferred.always(function(xhr, status, error)
            {
                this_.cache[uri].retrieving = false;

                this_.cache[uri].deferred.resolve(this_.cache[uri]);
            });

            promise = this.cache[uri].deferred.promise();
        }
        else
        {
            promise = new $.Deferred().resolve(this.cache[uri]);
        }

        return promise;
    },

    refreshTab: function(type, results, reload)
    {
        var error = false;

        for (var resultIndex in results)
        {
            var result = results[resultIndex];

            if (result.error != null)
            {
                this.showErrorPage(result.error);

                error = true;

                break;
            }
        }

        if (!error)
        {
            var lowerCaseType = this.typeToURI(type);

            if (reload || (this.cache[type]))
            {
                var tableTools = TableTools.fnGetInstance(type + "Table");

                var selected = tableTools.fnGetSelected();

                var tableData = this["get" + type + "TableData"](results);

                Application.ignoreScroll = true;

                this[lowerCaseType + "Table"].fnClearTable();

                this[lowerCaseType + "Table"].fnAddData(tableData);

                Application.ignoreScroll = false;

                this.restoreTableScrollPosition(type);

                var selectedRow = false;

                if (selected.length > 0)
                {
                    try
                    {
                        // Wrap the select around this flag so that refreshes
                        // don't cause the details to flash.
                        Application.refreshingTab = true;
                        tableTools.fnSelect(selected[0]);
                        Application.refreshingTab = false;

                        selectedRow = true;
                    }
                    catch (error)
                    {
                        this.setTableScrollPosition(type, 0);
                    }
                }

                if (!selectedRow)
                {
                    //tableTools.fnSelect($('#' + type + 'Table tbody tr')[0]);
  
                    if (this[lowerCaseType.slice(0, -1) + "Clicked"])
                    {
                        this[lowerCaseType.slice(0, -1) + "Clicked"]();
                    }
                }

                this.cache[type] = false;
            }

            this.showPage(type,
                          function()
                          {
                              Application[lowerCaseType + "Table"].fnDraw();
                          });

            this.restoreTablePageNumber(type); 

            this.restoreSelectedTableRowVisible(type);
        }
    },

    createTable: function(type, clickHandler, initialSort)
    {
        var tableConfig = this.getSelectableTableConfiguration(clickHandler, initialSort);

        tableConfig["aoColumns"] = this["get" + type + "Columns"]();

        var table = $("#" + type + "Table").dataTable(tableConfig);

        Utilities.addClearFilterButton(type + "TableContainer", table);

        $($("#" + type + "Table")[0].parentNode).scroll(this.saveTableScrollPosition);

        $("#" + type + "Table").on("page", this.saveTablePageNumber);

        return table;
    },

    saveTableScrollPosition: function(event)
    {
        if (!Application.ignoreScroll)
        {
            Application.tableScrollPositions[event.target.childNodes[0].id] = event.target.scrollTop;

            Application.saveSelectedTableRowVisible();
        }
    },   

    saveTablePageNumber: function(event)
    {
        var tableName = event.currentTarget.id;

        var table = $("#" + tableName).dataTable();

        var pageNumber = Application.getTablePageNumber(table);

        Application.tablePageNumbers[tableName] = pageNumber;
    },

    restoreTableScrollPosition: function(type)
    {
        var table = $("#" + type + "Table")[0];
        if (table != null)
        {
            var scrollPosition = Application.tableScrollPositions[type + "Table"];

            table.parentNode.scrollTop = scrollPosition;
        }
    },

    restoreTablePageNumber: function(type)
    {
        var table = $("#" + type + "Table").dataTable();
        if (table != null)
        {
            var pageNumber = Application.tablePageNumbers[type + "Table"] || 0;

            table.fnPageChange(pageNumber);
        }
    },

    setTableScrollPosition: function(type, scrollPosition)
    {
        Application.tableScrollPositions[type + "Table"] = scrollPosition;

        var table = $("#" + type + "Table")[0];
        if (table != null)
        {
            table.parentNode.scrollTop = scrollPosition;
        }
    },

    saveSelectedTableRowVisible: function()
    {
        var type = $(".menuItemSelected").attr("id");
        if (type != null)
        {
            Application.tableSelectedRowVisible[type + "Table"] = Application.isSelectedTableRowVisible(type);
        }
    },

    restoreSelectedTableRowVisible: function(type)
    {
        if (Application.tableSelectedRowVisible[type + "Table"])
        {
            Application.scrollSelectedTableRowIntoView(type);  
        }
    },

    isSelectedTableRowVisible: function(type)
    {
        var tableName = type + "Table";

        var table = $("#" + tableName)[0];

        var scrollBody = table.parentNode;

        var scrollPosition = scrollBody.scrollTop;

        var tableHeight = scrollBody.clientHeight;

        var tableTools = TableTools.fnGetInstance(tableName);

        var visible = false;

        var row = tableTools.fnGetSelected()[0];
  
        if (row != null)
        {
            var rowTop    = row.firstChild.offsetTop;
            var rowHeight = row.clientHeight;

            if ((rowTop > scrollPosition) && ((rowTop + rowHeight) < (scrollPosition + tableHeight)))
            {
                visible = true;
            }
        }

        return visible;
    },

    getTablePageNumber: function(table)
    {
        var settings = table.fnSettings();

        return settings._iDisplayLength === -1 ? 0 : Math.ceil(settings._iDisplayStart / settings._iDisplayLength);
    },

    /**
     * Takes into consideration table paging.  The rowIndex passed in is the 
     * index of the data from the original table data array.
     */
    selectTableRow: function(table, rowIndex)
    {   
        var pageSize = table.fnSettings()._iDisplayLength;

        var pageNum = Math.floor(rowIndex / pageSize);

        var indexInPage = rowIndex % pageSize;

        table.fnPageChange(pageNum);

        var tableTools = TableTools.fnGetInstance(table.selector.substring(1));

        tableTools.fnSelect($(table.selector + " tbody tr")[indexInPage]);
    },    

    pageTableRowIntoView: function(tableType, row)
    {
        var tableName = tableType + "Table"; 

        var table = $("#" + tableName).dataTable();

        var settings = table.fnSettings();
          
        var rowIndex = -1;
        var numRows = settings.aiDisplay.length;
        for (var index = 0; index < numRows; index++)
        {
            if (settings.aoData[settings.aiDisplay[index]].nTr == row)
            {
                rowIndex = index;
                break;
            }
        }

        var pageSize = settings._iDisplayLength;

        var pageNum = Math.floor(rowIndex / pageSize);

        table.fnPageChange(pageNum);        
    },

    scrollSelectedTableRowIntoView: function(tableType)
    {
        var tableName = tableType + "Table";      

        var table = $("#" + tableName)[0];

        var scrollHeight = table.scrollHeight;

        var scrollBody = table.parentNode;

        var scrollPosition = scrollBody.scrollTop;

        var tableHeight = scrollBody.clientHeight;

        var tableTools = TableTools.fnGetInstance(tableName);

        var row = tableTools.fnGetSelected()[0];

        Application.pageTableRowIntoView(tableType, row);

        var rowTop    = row.firstChild.offsetTop;
        var rowHeight = row.clientHeight;

        var newTop = scrollPosition;

        /*
        if (rowTop < scrollPosition)
        {
            newTop = (rowTop - rowHeight);

        }
        else if ((rowTop + rowHeight) > (scrollPosition + tableHeight))
        {
            newTop = rowTop - tableHeight + (rowHeight * 2);
        }
        */

        if ((rowTop < scrollPosition) || ((rowTop + rowHeight) > (scrollPosition + tableHeight)))
        {
            newTop = rowTop - (tableHeight / 2) + (rowHeight / 2);
        }

        newTop = Math.max(newTop, 0);
        newTop = Math.min(newTop, (scrollHeight - tableHeight));

        if (newTop != scrollPosition)
        {
            scrollBody.scrollTop = newTop;
        }
    },

    getSelectableTableConfiguration: function(clickHandler, initialSort)
    {
        var config = {
                         "sPaginationType": "full_numbers",
                         "aLengthMenu": [[5, 10, 25, 50, 100, -1], [5, 10, 25, 50, 100, "All"]],
                         "iDisplayLength": 100,
                         "sScrollY": "300px",
                         "bScrollCollapse": true,
                         "sDom": 'T<"clear">lfrtip',
                         "bAutoWidth": false,
                         "aaSorting": initialSort,
                         "oTableTools": {                                      
                                            "aButtons": []
                                        }
                     };

        if (clickHandler != null)
        {
            config.oTableTools.sRowSelect      = "single";
            config.oTableTools.fnRowSelected   = clickHandler;
            config.oTableTools.fnRowDeselected = clickHandler;
        }
        else
        {
            config.oTableTools.sRowSelect = "none";
        }

        return config;
    },

    getCloudControllersColumns: function()
    {
        return [
                   {
                       "sTitle":  "Name",
                       "sWidth":  "200px"
                   },
                   {
                       "sTitle":  "State",
                       "sWidth":  "80px",
                       "mRender": this.formatStatus
                   },
                   {
                       "sTitle":  "Cores",
                       "sWidth":  "60px",
                       "sClass":  "cellRightAlign",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "CPU",
                       "sWidth":  "60px",
                       "sClass":  "cellRightAlign",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Memory",
                       "sWidth":  "80px",
                       "sClass":  "cellRightAlign",
                       "mRender": Utilities.formatNumber
                   }
               ];
    },

    getHealthManagersColumns: function()
    {
        return [
                   {
                       "sTitle":  "Name",
                       "sWidth":  "200px"
                   },
                   {
                       "sTitle":  "State",
                       "sWidth":  "80px",
                       "mRender": this.formatStatus
                   },
                   {
                       "sTitle":  "Cores",
                       "sWidth":  "60px",
                       "sClass":  "cellRightAlign",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "CPU",
                       "sWidth":  "60px",
                       "sClass":  "cellRightAlign",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Memory",
                       "sWidth":  "80px",
                       "sClass":  " cellRightAlign",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Users",
                       "sWidth":  "80px",
                       "sClass":  "cellRightAlign",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Applications",
                       "sWidth":  "80px",
                       "sClass":  "cellRightAlign",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Instances",
                       "sWidth":  "80px",
                       "sClass":  "cellRightAlign",
                       "mRender": Utilities.formatNumber
                   }
               ];
    },

    getGatewaysColumns: function()
    {
        return [
                   {
                       "sTitle":  "Name",
                       "sWidth":  "100px"
                   },
                   {
                       "sTitle":  "State",
                       "sWidth":  "80px",
                       "mRender": this.formatStatus
                   },
                   {
                       "sTitle":  "Description",
                       "sWidth":  "200px"
                   },
                   {
                       "sTitle":  "CPU",
                       "sWidth":  "50px",
                       "sClass":  "cellRightAlign",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Memory",
                       "sWidth":  "70px",
                       "sClass":  "cellRightAlign",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Nodes",
                       "sWidth":  "60px",
                       "sClass":  "cellRightAlign",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Provisioned<br/>Services",
                       "sWidth":  "90px",
                       "sClass":  "cellRightAlign",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Available<br/>Capacity",
                       "sWidth":  "80px",
                       "sClass":  "cellRightAlign",
                       "sType":   "styled-formatted-num",
                       "mRender": this.formatAvailableCapacity
                   },
                   {
                       "sTitle":  "% Available<br/>Capacity",
                       "sWidth":  "90px",
                       "sClass":  "cellRightAlign",
                       "sType":   "formatted-num",
                       "mRender": Utilities.formatNumber
                   }
               ];
    },

    getGatewayNodesColumns: function()
    {
        return [
                   {
                       "sTitle":  "Name",
                       "sWidth":  "150px"
                   },
                   {
                       "sTitle":  "Available Capacity",
                       "sWidth":  "80px",
                       "sClass":  "cellRightAlign",
                       "sType":   "styled-formatted-num",
                       "mRender": this.formatAvailableCapacity
                   }
               ];
    },

    getRoutersColumns: function()
    {
        return [
                   {
                       "sTitle":  "Name",
                       "sWidth":  "200px"
                   },
                   {
                       "sTitle":  "State",
                       "sWidth":  "80px",
                       "mRender": this.formatStatus
                   },
                   {
                       "sTitle":  "Cores",
                       "sWidth":  "60px",
                       "sClass":  "cellRightAlign",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "CPU",
                       "sWidth":  "60px",
                       "sClass":  "cellRightAlign",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle" :  "Memory",
                       "sWidth":  "80px",
                       "sClass":  "cellRightAlign",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Droplets",
                       "sWidth":  "80px",
                       "sClass":  "cellRightAlign",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Requests",
                       "sWidth":  "80px",
                       "sClass":  "cellRightAlign",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Bad Requests",
                       "sWidth":  "110px",
                       "sClass":  "cellRightAlign",
                       "mRender": Utilities.formatNumber
                   }
               ];
    },

    getDropletExecutionAgentsColumns: function()
    {
        return [
                   {
                       "sTitle": "Name",
                       "sWidth": "200px"
                   },
                   {
                       "sTitle":  "Status",
                       "sWidth":  "80px",
                       "mRender": this.formatStatus
                   },
                   {
                       "sTitle":  "Started",
                       "sWidth":  "170px",
                       "mRender": Utilities.formatDateString
                   },
                   {
                       "sTitle":  "CPU",
                       "sWidth":  "50px",
                       "sClass":  "cellRightAlign",
                       "sType":   "formatted-num",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Memory",
                       "sWidth":  "80px",
                       "sClass":  "cellRightAlign",
                       "sType":   "formatted-num",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Disk",
                       "sWidth":  "80px",
                       "sClass":  "cellRightAlign",
                       "sType":   "formatted-num",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Apps",
                       "sWidth":  "50px",
                       "sClass":  "cellRightAlign",
                       "sType":   "formatted-num",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Max",
                       "sWidth":  "50px",
                       "sClass":  "cellRightAlign",
                       "sType":   "formatted-num",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Reserved",
                       "sWidth":  "80px",
                       "sClass":  " cellRightAlign",
                       "sType":   "formatted-num",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Free",
                       "sWidth":  "50px",
                       "sClass":  "cellRightAlign",
                       "sType":   "styled-formatted-num",
                       "mRender": this.formatFreeMemory
                   },
                   {
                       "sTitle":  "% Free",
                       "sWidth":  "60px",
                       "sClass":  "cellRightAlign",
                       "sType":   "formatted-num",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Used",
                       "sWidth":  "50px",
                       "sClass":  "cellRightAlign",
                       "sType":   "formatted-num",
                       "mRender": Utilities.formatNumber
                   }
               ];
    },

    getApplicationsColumns: function()
    {
        return [
                   {
                       "sTitle": "Name",
                       "sWidth": "150px"
                   },
                   {
                       "sTitle":  "State",
                       "sWidth":  "80px",
                       "mRender": this.formatStatus
                   },
                   {
                       "sTitle":  "Started",
                       "sWidth":  "170px",
                       "mRender": Utilities.formatDateString
                   },
                   {
                       "sTitle":  "URI",
                       "sWidth":  "200px",
                       "mRender": this.formatURIs
                   },
                   {
                       "sTitle":  "User",
                       "sWidth":  "100px",
                       "mRender": this.formatUsers
                   },
                   {
                       "sTitle": "Framework",
                       "sWidth": "90px"
                   },
                   {
                       "sTitle": "Runtime",
                       "sWidth": "80px"
                   },
                   {
                       "sTitle":  "CPU",
                       "sWidth":  "50px",
                       "sClass":  "cellRightAlign",
                       "sType":   "formatted-num",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Memory",
                       "sWidth":  "80px",
                       "sClass":  "cellRightAlign",
                       "sType":   "formatted-num",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Disk",
                       "sWidth":  "70px",
                       "sClass":  "cellRightAlign",
                       "sType":   "formatted-num",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Instance",
                       "sWidth":  "70px",
                       "sClass":  "cellRightAlign",
                       "sType":   "formatted-num",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "DEA",
                       "sWidth":  "10px",
                       "mRender": this.formatDEA
                   }
               ];
    },

    getUsersColumns: function()
    {
        return [
                   {
                       "sTitle": "Email",
                       "sWidth": "150px"
                   },
                   {
                       "sTitle":  "Total",
                       "sWidth":  "70px",
                       "sClass":  "cellRightAlign",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Running",
                       "sWidth":  "70px",
                       "sClass":  "cellRightAlign",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Stopped",
                       "sWidth":  "70px",
                       "sClass":  "cellRightAlign",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Unknown",
                       "sWidth":  "70px",
                       "sClass":  "cellRightAlign",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "CPU",
                       "sWidth":  "50px",
                       "sClass":  "cellRightAlign",
                       "sType":   "formatted-num",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Reserved",
                       "sWidth":  "100px",
                       "sClass":  "cellRightAlign",
                       "sType":   "formatted-num",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Used",
                       "sWidth":  "100px",
                       "sClass":  "cellRightAlign",
                       "sType":   "formatted-num",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Free",
                       "sWidth":  "100px",
                       "sClass":  "cellRightAlign",
                       "sType":   "formatted-num",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle" : "Reserved",
                       "sWidth":  "100px",
                       "sClass":  "cellRightAlign",
                       "sType":   "formatted-num",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle" : "Used",
                       "sWidth":  "100px",
                       "sClass":  "cellRightAlign",
                       "sType":   "formatted-num",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle" : "Free",
                       "sWidth":  "100px",
                       "sClass":  "cellRightAlign",
                       "sType":   "formatted-num",
                       "mRender": Utilities.formatNumber
                   }
               ];
    },

    getComponentsColumns: function()
    {
        return [
                   {
                       "sTitle":  "Name",
                       "sWidth":  "200px"
                   },
                   {
                       "sTitle":  "Type",
                       "sWidth":  "200px"
                   },
                   {
                       "sTitle":  "Started",
                       "sWidth":  "170px",
                       "mRender": Utilities.formatDateString
                   },
                   {
                       "sTitle":  "State",
                       "sWidth":  "80px",
                       "mRender": this.formatStatus
                   }
               ];
    },

    getLogsColumns: function()
    {
        return [
                   {
                       "sTitle": "Path",
                       "sWidth": "380px"
                   },
                   {
                       "sTitle" : "Size",
                       "sWidth":  "100px",
                       "sClass":  "cellRightAlign",
                       "sType":   "formatted-num",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Last Modified",
                       "sWidth":  "170px",
                       "mRender": Utilities.formatDateNumber
                   }
               ];
    },

    getTasksColumns: function()
    {
        return [
                   {
                       "sTitle": "Command",
                       "sWidth": "500px"
                   },
                   {
                       "sTitle" : "State",
                       "sWidth":  "80px"
                   },
                   {
                       "sTitle":  "Started",
                       "sWidth":  "170px",
                       "mRender": Utilities.formatDateNumber
                   }
               ];
    },

    getStatsColumns: function()
    {
        return [
                   {
                       "sTitle":  "Date",
                       "sWidth":  "170px",
                       "mRender": Utilities.formatDateNumber
                   },
                   {
                       "sTitle":  "Total",
                       "sWidth":  "80px",
                       "sClass":  "cellRightAlign",
                       "sType":   "formatted-num",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "With Apps",
                       "sWidth":  "80px",
                       "sClass":  "cellRightAlign",
                       "sType":   "formatted-num",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Apps",
                       "sWidth":  "80px",
                       "sClass":  "cellRightAlign",
                       "sType":   "formatted-num",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Running",
                        "sWidth":  "80px",
                       "sClass":  "cellRightAlign",
                       "sType":   "formatted-num",
                       "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "Total",
                       "sWidth":  "80px",
                       "sClass":  "cellRightAlign",
                       "sType":   "formatted-num",
                        "mRender": Utilities.formatNumber
                   },
                   {
                       "sTitle":  "DEAs",
                       "sWidth":  "80px",
                       "sClass":  "cellRightAlign",
                       "sType":   "formatted-num",
                       "mRender": Utilities.formatNumber
                   }  
               ];
    },

    getTableData: function(results, type)
    {
        var tableData = new Array();

        var items = results[0].response;

        for (var index in items)
        {
            var item = items[index];

            var row = new Array();

            this["get" + type + "Row"](row, item);

            tableData.push(row);
        }

        return tableData;
    },

    itemClicked: function(type, index, ignoreState)
    {
        var tableTools = TableTools.fnGetInstance(type + "sTable");

        var selected = tableTools.fnGetSelectedData();


        Application.hideDetails(type);

        if ((selected.length > 0) && (ignoreState || (selected[0][1] == Application.STATUS__RUNNING)))
        {
            $("#" + type + "DetailsLabel").show();

            var containerDiv = $("#" + type + "PropertiesContainer").get(0);

            var table = Application.createPropertyTable(containerDiv);

            var item = (index > 0) ? selected[0][index] : null;

            this["handle" + type + "Clicked"](table, item, selected[0]);
        }
    },

    removeItemConfirmation: function(uri)
    {
        Application.showDialog("Confirmation", "Are you sure you want to remove " + uri + "?", 
                               function()
                               {
                                   Application.removeItem(uri);
                               });
    },

    removeItem: function(uri)
    {
        Application.showWaitCursor();

        Application.hideDialog();

        var removeURI = "removeConfigurationItem";

        if (uri != null)
        {
            removeURI += "?uri=" + encodeURIComponent(uri); 
        }

        var deferred = $.ajax({
                                  url: removeURI,
                                  dataType: "json",
                                  type: "DELETE"
                              });

        deferred.done(function(response, status)
        {            
            var type = Application.getCurrentPageID();

            var tableTools = TableTools.fnGetInstance(type + "Table");

            tableTools.fnSelectNone();

            Application.refreshButton(); 
        });

        deferred.fail(function(xhr, status, error)
        {
            var errorMessage = "There was an error removing ";

            if (uri != null)
            {
                errorMessage += uri;
            }
            else
            {
                errorMessage += "all components";
            }

            Application.showDialog("Error", errorMessage + ": <br/><br/>" + error);
        });
    },

    initializeLink: function(linkElement, uri)
    {
        $(linkElement).attr("href", uri);
        $(linkElement).html(uri);

        var this_ = this;

        $(linkElement).off("click");

        $(linkElement).click(function()
        {
            var deferred = $.ajax({
                                      url: "fetch?uri=" + encodeURIComponent(uri),
                                      dataType: "json"
                                  });

            deferred.done(function(response, status)
            {
                var page = window.open("", "_blank", "fullscreen=yes,menubar=no,scrollbars=yes,titlebar=no,toolbar=no");

                var content = "";

                if (response.connected)
                {
                    content = JSON.stringify(response.data, null, 4)
                }
                else
                {
                    content = response.error;
                }

                page.document.write("<pre>" + content + "</pre>");
                page.document.close();
            });

            deferred.fail(function(xhr, status, error)
            {
                var page = window.open("", "_blank", "fullscreen=yes,menubar=no,scrollbars=yes,titlebar=no,toolbar=no");
                page.document.write(xhr.responseText);
                page.document.close();
            });

            return false;
        });
    },

    typeToURI: function(type)
    {
        return type.charAt(0).toLowerCase() + type.slice(1);
    },

    showDialog: function(title, text, handler)
    {        
        if (handler != null)
        {
            $("#DialogOkayButton").removeClass("hiddenPage");

            $("#DialogOkayButton").off("click.Dialog");
            $("#DialogOkayButton").on("click.Dialog", handler);

            $("#DialogCancelButton").text("Cancel");
        }
        else
        {
            $("#DialogOkayButton").addClass("hiddenPage");

            $("#DialogCancelButton").text("Close");
        }

        var windowHeight = $(window).height();
        var windowWidth  = $(window).width();

        $("#Dialog").css("top",  (windowHeight / 2) - 100);
        $("#Dialog").css("left", (windowWidth  / 2) - 200);

        $("#DialogTitle").text(title);

        $("#DialogText").text("");
        $("#DialogText").append(text);

        $("#Dialog").removeClass("hiddenPage");
	},

  hideDialog: function()
  {
      $("#Dialog").addClass("hiddenPage");
  }

};

