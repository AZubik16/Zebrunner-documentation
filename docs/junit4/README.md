## Zebrunner JUnit 4 agent
Official Zebrunner JUnit 4 agent providing reporting and smart reruns functionality. In order to enable Zebrunner Listener for JUnit no special configuration required - service discovery mechanism will automatically register listener once it will be available on your test application classpath.

### Checking out and building
To check out the project and build from source, do the following:

    git clone git://github.com/zebrunner/java-agent-junit.git
    cd java-agent-junit
    ./gradlew build

### Including into your project
gent comes bundled with JUnit 4.13, so you may want to comment our your dependency or exclude it from agent.

<!-- tabs:start -->

#### ** Gradle **
```gradle
    dependencies {
      testImplementation 'com.zebrunner:agent-junit:1.0.0'
    }

    test.doFirst {
       jvmArgs "-javaagent:${classpath.find { it.name == 'agent-junit-1.0-SNAPSHOT.jar' }.absolutePath}"
    }
```

#### ** Maven **
```xml
    <dependencies>
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
            <version>1.7.30</version>
        </dependency>
        <dependency>
            <groupId>org.apache.logging.log4j</groupId>
            <artifactId>log4j-api</artifactId>
            <version>2.13.3</version>
        </dependency>
        <dependency>
            <groupId>org.apache.logging.log4j</groupId>
            <artifactId>log4j-core</artifactId>
            <version>2.13.3</version>
        </dependency>
    </dependencies>
```

<!-- tabs:end -->


### Agent configuration
Once agent is available on classpath of your test project it is automatically enabled and expects a valid configuration to be available.
It is currently possible to provide a configuration via:

    1. Environment variables
    2. Program arguments
    3. YAML file
    4. Properties file

Configuration lookup will be performed in order listed above, meaning that environment configuration will always take precedence over YAML and so on.
It is also possible to override configuration parameters by supplying them via configuration provider having higher precedence.

Once configuration is in place agent is ready to track you test run events, no additional configuration required.

#### Environment configuration
The following configuration parameters are recognized by agent:

- `REPORTING_ENABLED` - optional, default value: `true`. Enables or disables reporting. Once disabled - agent will use no op component implementations that will simply log output for tracing purpose
- `REPORTING_SERVER_HOSTNAME` - mandatory. Zebrunner server hostname
- `REPORTING_SERVER_ACCESS_TOKEN` - mandatory. Access token to be used to perform API calls. Can be obtained by visiting Zebrunner user profile page

#### Program arguments configuration
The following configuration parameters are recognized by agent:

- `reporting.enabled` - optional, default value: `true`. Enables or disables reporting. Once disabled - agent will use no op component implementations that will simply log output for tracing purpose
- `reporting.server.hostname` - mandatory. Zebrunner server hostname
- `reporting.server.accessToken` - mandatory. Access token to be used to perform API calls. Can be obtained by visiting Zebrunner user profile page

#### YAML configuration
Agent will recognize `agent.yaml` or `agent.yml` file residing in resources root folder. It is currently not possible to configure alternative file location.
Below is sample configuration file:

```yaml
    reporting:
      enabled: true
      server:
        hostname: localhost:8080/api
        access-token: <token>
```

- `reporting.enabled` - optional, default value: `true`. Enables or disables reporting. Once disabled - agent will use no op component implementations that will simply log output for tracing purpose
- `reporting.server.hostname` - mandatory. Zebrunner server hostname
- `reporting.server.access-token` - mandatory. Access token to be used to perform API calls. Can be obtained by visiting Zebrunner user profile page

#### Properties configuration
Agent will recognize `agent.properties` file residing in resources root folder. It is currently not possible to configure alternative file location.
Below is sample configuration file:

```properties
reporting.enabled=true
reporting.server.hostname=localhost:8080
reporting.server.access-token=<token>
```

- `reporting.enabled` - optional, default value: `true`. Enables or disables reporting. Once disabled - agent will use no op component implementations that will simply log output for tracing purpose
- `reporting.server.hostname` - mandatory. Zebrunner server hostname
- `reporting.server.access-token` - mandatory. Access token to be used to perform API calls. Can be obtained by visiting Zebrunner user profile page

### Advanced reporting
It is possible to configure additional reporting capabilities improving your tracking experience.

### Collecting test logs
It is also possible to enable log collection for your tests. Currently three logging frameworks are supported out of the box: logback, log4j, log4j2.
In order to enable logging all you have to do is register reporting appender in your test framework configuration file.

#### Logback
Sample **logback.xml**:
```
    <?xml version="1.0" encoding="UTF-8"?>
    <configuration>
        <appender name="ReportingAppender" class="com.zebrunner.agent.core.appender.logback.ReportingAppender">
           <encoder>
              <pattern>%d{HH:mm:ss.SSS} [%t] %-5level - %msg%n</pattern>
           </encoder>
        </appender>
        <root level="info">
            <appender-ref ref="ReportingAppender" />
        </root>
    </configuration>
```

#### Log4j
Sample **log4j.properties**:
```
    log4j.rootLogger = INFO, zebrunner
    log4j.appender.zebrunner=com.zebrunner.agent.core.appender.log4j.ReportingAppender
    log4j.appender.zebrunner.layout=org.apache.log4j.PatternLayout
    log4j.appender.zebrunner.layout.conversionPattern=pattern">[%d{HH:mm:ss}] %-5p (%F:%L) - %m%n
```

#### Log4j2
Sample **log4j2.xml**:
```
    <?xml version="1.0" encoding="UTF-8"?>
    <configuration packages="com.zebrunner.agent.core.appender.log4j2">
       <properties>
          <property name="pattern">[%d{HH:mm:ss}] %-5p (%F:%L) - %m%n</property>
       </properties>
       <appenders>
          <ReportingAppender name="ReportingAppender">
             <PatternLayout pattern="${pattern}" />
          </ReportingAppender>
       </appenders>
       <loggers>
          <root level="info">
             <appender-ref ref="ReportingAppender"/>
          </root>
       </loggers>
    </configuration>
```

### Capturing screenshots
In case you are using JUnit as a UI testing framework it might come handy to have an ability to track captured screenshots in scope of Zebrunner reporting.
Agent comes with a Java API allowing you to send your screenshots to Zebrunner so they will be attached to test run.
Below is a sample code of test sending screenshot to Zebrunner:

```java
    import com.zebrunner.agent.core.registrar.Screenshot;
    import org.junit.Test;

    public class AwesomeTests {

        @Test
        public void myAwesomeTest() {
            // capture screenshot
            Screenshot.upload(screenshotBytes, capturedAtMillis);
            // meaningful assertions
        }

    }
```

Screenshot should be passed as byte array along with unix timestamp in milliseconds corresponding to the moment when screenshot was captured.
If `null` is supplied instead of timestamp - it will be generated automatically, however it is strongly recommended to include accurate timestamp in order to get accurate tracking.

### Tracking test maintainer
You might want to add transparency to the process of automation maintenance by having an engineer responsible for evolution of specific tests or test classes.
Zebrunner comes with a concept of maintainer - a person that can be assigned to maintain tests. In order to keep track of those agent comes with `@Maintainer` annotation.
Test classes and methods can be annotated. It is also possible to override class-level maintainer on a mehtod-level.
See a sample test class below:

```java
    import com.zebrunner.agent.core.reporting.Maintainer;
    import org.junit.Test;

    @Maintainer("kenobi")
    public class AwesomeTests {

        @Test
        @Maintainer("skywalker")
        public void awesomeTest() {
            // meaningful assertions
        }

        @Test
        public void anotherAwesomeTest() {
            // meaningful assertions
        }


    }
```

In the example above `kenobi` will be reported as a maintaner of `anotherAwesomeTest` (class-level value taken into account), while `skywalker` will be reported as a mainainer of test `awesomeTest`.
Maintainer username should be valid Zebrunner username, otherwise it will be set to `anonymous`.

### License
Zebrunner Reporting service is released under version 2.0 of the [Apache License](https://www.apache.org/licenses/LICENSE-2.0).
