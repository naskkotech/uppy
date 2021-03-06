// import * as Expo from 'expo'
import React from 'react'
import {
  Text,
  View,
  AsyncStorage,
  Image
  // Linking
} from 'react-native'
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'
import UppyFilePicker from '@uppy/react-native'
import FileList from './FileList'
import PauseResumeButton from './PauseResumeButton'
import ProgressBar from './ProgressBar'
import SelectFiles from './SelectFilesButton'

function hashCode (str) {
  // from https://stackoverflow.com/a/8831937/151666
  var hash = 0
  if (str.length === 0) {
    return hash
  }
  for (var i = 0; i < str.length; i++) {
    var char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash
}

function customFingerprint (file, options) {
  let exifHash = 'noexif'
  if (file.exif) {
    exifHash = hashCode(JSON.stringify(file.exif))
  }
  // console.log(exifHash)
  const fingerprint = ['tus', file.name || 'noname', file.size || 'nosize', exifHash].join('/')
  console.log(fingerprint)
  return fingerprint
}

export default class App extends React.Component {
  constructor () {
    super()

    this.state = {
      progress: 0,
      total: 0,
      file: null,
      uploadURL: null,
      isFilePickerVisible: false,
      isPaused: false,
      uploadStarted: false,
      uploadComplete: false,
      info: null,
      totalProgress: 0
    }

    this.isReactNative = (typeof navigator !== 'undefined' &&
      typeof navigator.product === 'string' &&
      navigator.product.toLowerCase() === 'reactnative')

    this.showFilePicker = this.showFilePicker.bind(this)
    this.hideFilePicker = this.hideFilePicker.bind(this)
    this.togglePauseResume = this.togglePauseResume.bind(this)

    console.log('Is this React Native?', this.isReactNative)
    this.uppy = Uppy({ autoProceed: true, debug: true })
    this.uppy.use(Tus, {
      endpoint: 'https://master.tus.io/files/',
      urlStorage: AsyncStorage,
      fingerprint: customFingerprint
    })
    this.uppy.on('upload-progress', (file, progress) => {
      this.setState({
        progress: progress.bytesUploaded,
        total: progress.bytesTotal,
        totalProgress: this.uppy.state.totalProgress,
        uploadStarted: true
      })
    })
    this.uppy.on('upload-success', (file, response) => {
      // console.log(file.name, response)
    })
    this.uppy.on('complete', (result) => {
      this.setState({
        status: 'Upload complete ✅',
        uploadURL: result.successful[0] ? result.successful[0].uploadURL : null,
        uploadComplete: true,
        uploadStarted: false
      })
      console.log('Upload complete:', result)
    })

    this.uppy.on('info-visible', () => {
      const info = this.uppy.getState().info
      this.setState({
        info: info
      })
      console.log('uppy-info:', info)
    })

    this.uppy.on('info-hidden', () => {
      this.setState({
        info: null
      })
    })
  }

  showFilePicker () {
    this.setState({
      isFilePickerVisible: true,
      uploadStarted: false,
      uploadComplete: false
    })
  }

  hideFilePicker () {
    this.setState({
      isFilePickerVisible: false
    })
  }

  togglePauseResume () {
    if (this.state.isPaused) {
      this.uppy.resumeAll()
      this.setState({
        isPaused: false
      })
    } else {
      this.uppy.pauseAll()
      this.setState({
        isPaused: true
      })
    }
  }

  render () {
    return (
      <View style={{
        paddingTop: 100,
        paddingLeft: 50,
        paddingRight: 50,
        flex: 1
      }}>
        <Text style={{
          fontSize: 25,
          marginBottom: 20,
          textAlign: 'center'
        }}>Uppy in React Native</Text>
        <View style={{alignItems: 'center'}}>
          <Image
            style={{width: 80, height: 78, marginBottom: 50}}
            source={require('./assets/uppy-logo.png')}
          />
        </View>
        <SelectFiles showFilePicker={this.showFilePicker} />

        {this.state.info
          ? <Text style={{
            marginBottom: 10,
            marginTop: 10,
            color: '#b8006b'}}>{this.state.info.message}</Text>
          : null
        }

        <ProgressBar progress={this.state.totalProgress} />

        <PauseResumeButton
          isPaused={this.state.isPaused}
          onPress={this.togglePauseResume}
          uploadStarted={this.state.uploadStarted}
          uploadComplete={this.state.uploadComplete} />

        <UppyFilePicker
          show={this.state.isFilePickerVisible}
          uppy={this.uppy}
          onRequestClose={this.hideFilePicker}
          serverUrl="http://localhost:3020" />

        <FileList uppy={this.uppy} />

        {/* <Text>{this.state.status ? 'Status: ' + this.state.status : null}</Text>
        <Text>{this.state.progress} of {this.state.total}</Text> */}
      </View>
    )
  }
}
