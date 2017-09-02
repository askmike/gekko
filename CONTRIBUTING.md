# Contributing

Thanks for (thinking about) contributing to Gekko, all help is wanted!

## Before Submitting an Issue

First, please do a search in [open issues](https://github.com/askmike/gekko/issues/) to see if the issue or feature request has already been filed.

If you find your issue already exists, make relevant comments and add your reaction:

👍 - upvote

👎 - downvote

If you cannot find an existing issue that describes your bug or feature, submit an issue using the guidelines below.

### Submitting an issue (bug)

* Be as clear and concise as possible.
* Do not submit more than one bug in a single issue.
* Clearly explain the following:

1. Action taken (what you did)
2. Expected result (what you hoped would happen)
3. Actual result (unexpected outcome)
4. Your setup (any and all relevant technical facts, error messages, logs, etc)

### Feature requests

* First consider if **you** yourself might be able to work on the feature?  If so, check out info on contributing code below.
* If you do not have the skills, then please take the time to clearly think through the request. Is is appropriate for all users of Gekko?  If so, create a new issue containing the following:

1. Write `[request]` as the first item in the title, followed by a short, concise description, eg: `[request] Export data to CSV`.
2. Fill in details explaining your request.  Be as clear and concise as possible and only 1 request at a time.
3. Add mock-ups, etc as needed to clearly demonstrate the idea.

## New Feature and code contributions

- If you want to add an exchange to Gekko, see [this doc](https://github.com/askmike/gekko/blob/develop/docs/internals/exchanges.md) for all the information you need.
- If you want to Gekko react to anything from the market, you can most likely put this functionality into a plugin. See [this document](https://github.com/askmike/gekko/blob/develop/docs/internals/plugins.md) for details.
- If you want to add trading strategies / indicators, please see [this document](https://github.com/askmike/gekko/blob/develop/docs/trading_bot/creating_a_trading_method.md).
- If you just want to work on Gekko, you can use the open issues with the tag `open-for-pulls` for inspiration.
- If you want to work on the web interface (Gekko UI), please see [this frontend doc](https://github.com/askmike/gekko/blob/develop/docs/internals/gekko_ui.md) on the Vue.js frontend.

Things to take into consideration when submitting a pull request:

 - Please submit all pull requests (except for hotfixes) to the [develop branch](https://github.com/askmike/gekko/tree/develop).
 - Please keep current code styling in mind.
