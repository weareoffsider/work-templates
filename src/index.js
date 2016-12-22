import inquirer from 'inquirer'
import userhome from 'userhome'
import path from 'path'
import async from 'async'
import {cwd} from 'process'
import range from 'lodash/range'
import compact from 'lodash/compact'
import uniq from 'lodash/uniq'
import mkdirp from 'mkdirp'
import {readFile, readFileSync, writeFile} from 'fs'
import tmpl from 'lodash/template'
import colors from 'colors/safe'

const configNames = [
  '.work-templates.conf',
]

const paths = cwd().split(path.sep)

const walked_path = range(paths.length).reduce((all, ix) => {
  if (ix > 0) {
    const newPaths = configNames.map((cName) =>
      paths.slice(0, ix + 1).join(path.sep) + path.sep + cName
    )
    return all.concat(newPaths)
  }

  return all
}, [])

const all_paths = uniq(
  walked_path.concat(configNames.map((p) => userhome(p)))
)

console.log('Work Templates')
console.log('')
console.log('Loading config files...')

async.parallel(
  all_paths.map((configPath) => (cb) => {
    readFile(configPath, (err, data) => {
      if (err) {
        cb(null, null)
      } else {
        const configData = JSON.parse(data.toString())
        configData.rootPath = path.dirname(configPath)

        cb(null, configData)
      }
    })
  }),
  function (err, results) {
    const validConfigs = compact(results)

    if (validConfigs.length == 0) {
      // do some error handling
    } else {
      let iterator = 0

      const templates = validConfigs.reduce((acc, config) => {
        console.log('\nTemplates at: ' + config.rootPath)

        const lines = config.templates.map((templatePath) => {
          console.log('[' + iterator + '] ' + templatePath)
          iterator++
          return {
            path: config.rootPath + path.sep + templatePath,
            root: config.rootPath,
          }
        })

        return acc.concat(lines)
      }, [])

      console.log('')
      promptTemplateChoice(templates)

    }
  }
)

function promptTemplateChoice (options) {
  inquirer.prompt([{
    'type': 'input',
    'name': 'optionIx',
    'message': 'Which template would you like to use?',
  }]).then(({optionIx}) => {
    runTemplateQuestions(options[optionIx])
  })
}

function runTemplateQuestions (template) {
  const templateModule = require(template.path)

  inquirer.prompt(templateModule.questions()).then((results) => {
    const files = templateModule.setup(template.root, results)
    async.parallel(
      files.map((file) => (cb) => {
        const src = template.path + path.sep + file.src
        const templateContents = readFileSync(src, "utf8")
        const contents = tmpl(templateContents)(file.data)

        const destDir = path.dirname(file.dest)

        mkdirp(destDir, (err) => {
          if (err) { cb(err) }

          writeFile(file.dest, contents, (err) => {
            cb(err, file)
          })
        })
      }),

      function (err, results) {
        console.log(colors.green('Template successfully rendered.'))
        results.forEach((file) => {
          const projectPath = file.dest.replace(template.root, '')
          console.log(
            ' --> ',
            colors.blue(projectPath)
          )
        })
      }
    )
  }).catch((err) => {
    console.log(colors.red(err))
  })
}
