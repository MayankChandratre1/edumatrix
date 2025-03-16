import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FormDetails } from '@/Section/School/component/form-details'
import { CalendarIcon, ClipboardIcon, StarIcon, MinusCircleIcon, Edit2Icon, Trash2Icon } from 'lucide-react'
import { deleteForm, getForms } from '@/api'
import { toast } from '@/hooks/use-toast'
import { Form, Question } from '@/lib/types'
import { useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'

export default function ViewFormsTeacher() {
  const [forms, setForms] = useState<Form[]>([])
  const [selectedForm, setSelectedForm] = useState<Form | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ form: Form | null, open: boolean }>({ form: null, open: false })

  const openDeleteModal = (form: Form) => {
    setDeleteModal({ form, open: true })
  }

  const closeDeleteModal = () => {
    setDeleteModal({ form: null, open: false })
  }

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const data = await getForms(localStorage.getItem('token')!)
        if (data.error) {
          toast({
            title: 'Error',
            description: data.error,
            variant: 'destructive'
          })
        } else {
          setForms(data.forms)
        }
      } catch (error) {
        console.error('Error fetching forms:', error)
      }
    }

    fetchForms()
  }, [])

  const navigate = useNavigate();

  const getFormTypeIcon = (formType: string) => {
    switch (formType) {
      case 'AwardPoints':
        return <StarIcon className="h-6 w-6 text-yellow-500" />
      case 'Feedback':
        return <ClipboardIcon className="h-6 w-6 text-blue-500" />
      case 'PointWithdraw':
        return <MinusCircleIcon className="h-6 w-6 text-red-500" />
      case 'DeductPoints':
        return <MinusCircleIcon className="h-6 w-6 text-orange-500" />
      default:
        return <ClipboardIcon className="h-6 w-6 text-gray-500" />
    }
  }

  const calculateTotalPoints = (questions: Question[]) => {
    if (questions.length === 0) return 0
    let sum = questions.reduce((sum, question) => sum + (question.maxPoints || 0), 0)
    questions.forEach(question => {
      if (question.type == 'select') {
        question.options?.forEach(option => {
          sum += option.points
        })
      }
    })
    return sum
  }

  const removeFromState = (id: string) => {
    setForms(prev => prev.filter(form => form._id !== id))
  }

  const removeForm = async (id: string) => {
    const removedForm = forms.filter(form => form._id === id)[0]
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error("Unauthorized request")
      const res = await deleteForm(id, token)
      removeFromState(id)
      if (res)
        return toast({
          title: "Success",
          description: `Successfully Deleted form ${res.formName}`
        })
    } catch (err) {
      setForms([...forms, removedForm])
      console.log(err)
      if (err instanceof AxiosError)
        toast({
          title: "Error",
          description: err.message
        })
      else
        toast({
          title: "Error",
          description: "Something Went Wrong"
        })
    }
  }

  const FormCard = ({ form }: { form: Form }) => (
    <Card className="flex flex-col h-full transform transition-all duration-200 hover:scale-[1.02] bg-white border shadow-md hover:shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b">
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold line-clamp-1">{form.formName}</CardTitle>
          <CardDescription className="text-sm font-medium text-[#00a58c]">
            {form.formType}
          </CardDescription>
        </div>
        <div className='p-2 bg-gray-50 rounded-full'>{getFormTypeIcon(form.formType)}</div>
      </CardHeader>
      <CardContent className="flex-1 pt-4">
        <div className="flex items-center text-sm text-gray-600">
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span>{new Date(form.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="mt-2 text-sm font-medium">
          Total Points: {calculateTotalPoints(form.questions)}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button
            className="bg-[#00a58c]/10 hover:bg-[#00a58c]/20 text-[#00a58c]"
            onClick={() => setSelectedForm(form)}
          >
            View Details
          </Button>
          <Button
            className="bg-[#00a58c] hover:bg-[#00a58c]/90 text-white"
            onClick={() => navigate(`/teachers/submitform/${form._id}`)}
          >
            Use Form
          </Button>
        </div>
        <div className="flex gap-2 mt-2">
          <Button
            className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600"
            onClick={() => navigate(`/teachers/editform/${form._id}`)}
          >
            <Edit2Icon className="h-4 w-4" />
            <span className="ml-2">Edit</span>
          </Button>
          <Button
            className="flex-1 bg-red-50 hover:bg-red-100 text-red-600"
            onClick={() => openDeleteModal(form)}
          >
            <Trash2Icon className="h-4 w-4" />
            <span className="ml-2">Delete</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Forms</h1>
          <p className="text-gray-600 mt-1">Manage and create your forms</p>
        </div>
        <Button
          className="bg-[#00a58c] hover:bg-[#00a58c]/90"
          onClick={() => navigate('/teachers/createform')}
        >
          Create New Form
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {forms.map((form) => (
          <FormCard key={form._id} form={form} />
        ))}
      </div>

      {/* Modals */}
      {deleteModal.open && deleteModal.form && (
        <FormDeleteModal form={deleteModal.form} onClose={closeDeleteModal} remove={removeForm} />
      )}
      {selectedForm && (
        <FormDetails form={selectedForm} onClose={() => setSelectedForm(null)} />
      )}
    </div>
  )
}

const FormDeleteModal = ({ form, onClose, remove }: { form: Form, onClose: () => void, remove: (id: string) => Promise<any> }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
      <h2 className="text-xl font-semibold text-gray-800">Delete Form</h2>
      <p className="mt-2 text-gray-600">
        Are you sure you want to delete <span className="font-semibold text-gray-800">{form.formName}</span>?
        This action cannot be undone.
      </p>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          className="bg-red-500 hover:bg-red-600 text-white"
          onClick={() => {
            remove(form._id)
            onClose()
          }}
        >
          Delete Form
        </Button>
      </div>
    </div>
  </div>
)