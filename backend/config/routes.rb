Rails.application.routes.draw do
  devise_for :users,
             path: "api/v1",
             path_names: { sign_in: "login", sign_out: "logout" },
             defaults: { format: :json },
             controllers: { sessions: "api/v1/sessions" },
             skip: %i[registrations passwords]

  namespace :api do
    namespace :v1 do
      get "me", to: "current_user#show"
      resources :users
      resources :departments, only: %i[index show]
      resources :salaries, only: %i[index show] do
        resources :revisions, only: %i[index show], controller: :salary_revisions
      end
    end
  end

  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"
end
