# cabinet-api-client
This library provides access to common Cabinet APIs.
### Usage

```javascript
    var cabinetApi = require('cabinet-api-client');

    var config = {
    	apiUrl: 'http://localhost:8080/api',
		timeout: 60000,
		username: 'username',
		password: 'password'
    }

    cabinetApi.configure(config);

    return cabinetApi.getEnrollment('userId', 'courseId')
		.then(function(enrollment) {
			//...
		}, function(err) {
			//...
		});
```
