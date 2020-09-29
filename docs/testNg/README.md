## TestNg agent

> Agent supports TestNG version starting from 7.0.0

Official Zebrunner TestNG agent providing reporting and smart reruns functionality. In order to enable Zebrunner Listener for TestNG no special configuration is required - service discovery mechanism will automatically register listener once it will be availlable on your test application classpath.

### Step1: Add project dependency

Agent comes bundled with TestNG 7.1.0, so you may want to comment our your dependency or exclude it from agent.

<!-- tabs:start -->

#### ** Maven **
```xml
    <dependency>
      <groupld>com.zebrunner</groupld>
        <artifactld>agent-testing</artifactld>
        <version>1.0.0</version>
    </dependency>
```

#### ** Gradle **
```xml
    <dependency>
        <groupld>com.zebrunner</groupld>
            <artifactld>agent-testing</artifactld>
            <version>1.0.0</version>
    </dependency>
```

<!-- tabs:end -->

### Step 2: Configure agent
There are multiple ways to provide agent configuration:
 * Environment variables
 * Program arguments
 * YAML file
 * Properties file

> Configuration lookup will be performed in order listed above, meaning that environment configuration will always take precedence over YAML and so on. It is also possible to override configuration parameters by supplying them via configuration provider having higher precedence. Once configuration is in place agent is ready to track you test run events, no additional configuration required.

<!-- tabs:start -->

#### ** Environment variable **

```
    REPORTING_ENABLED=true
    REPORTING_SERVER_HOSTNAME=localhost:8080
    REPORTING_SERVER_ACCESS_TOKEN-token=<token>
```

#### ** Program arguments **
```

```

#### ** agent.yaml **
```

```

#### ** agent.properties **
```

```
<!-- tabs:end -->

> Access token and hostname are available in [User profile](). Configuration files agent.yaml or agent.properties should be placed into project resource folder.

### Step 3: Advanced reporting
Read the following docs to enabled advanced reporting features:
   * [Configure loggers]()
   * [Capture screenshots]()
   * [Track test ownership]()
